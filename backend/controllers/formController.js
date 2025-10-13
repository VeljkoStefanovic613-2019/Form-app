// formController.js
import { Form } from '../models/Form.js';
import { Question } from '../models/Question.js';
import { Response } from '../models/Response.js';
import { User } from '../models/User.js';
import pool from '../config/database.js';

export const formController = {
  async createForm(req, res) {
    try {
      const { title, description, allow_unauthenticated, questions } = req.body;
      const userId = req.user.userId;

      const form = await Form.create({
        title,
        description,
        allow_unauthenticated: !!allow_unauthenticated,
        created_by: userId,
      });

      if (questions?.length > 0) {
        const questionsWithFormId = questions.map((q, index) => ({
          form_id: form.id,
          text: q.text,
          type: q.type,
          is_required: q.is_required || false,
          options: q.options || [],
          order_index: index,
          image_url: q.image_url || null,
        }));
        await Question.createBatch(questionsWithFormId);
      }

      res.status(201).json({
        id: form.id,
        title: form.title,
        description: form.description,
        allow_unauthenticated: form.allow_unauthenticated,
        created_by: form.created_by,
        created_at: form.created_at,
        updated_at: form.updated_at,
        is_locked: form.is_locked,
        questions: questions || []
      });
    } catch (error) {
      console.error('Create form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getForm(req, res) {
  try {
    const formId = req.params.id;
    const userId = req.user?.userId;
    
    const form = await formController.getFormWithQuestions(formId);

    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    // ✅ CRITICAL FIX: Check if form allows unauthenticated access
    if (!form.allow_unauthenticated && !userId) {
      return res.status(401).json({ 
        error: 'Authentication required to access this form' 
      });
    }
    
    // If user is authenticated, check if they can edit the form
    if (userId) {
      const isOwner = form.created_by === parseInt(userId);
      let isCollaborator = false;
      let collaboratorRole = null;
      
      // Check if user is a collaborator
      try {
        const collaborators = await Form.getCollaborators(formId);
        const userCollaboration = collaborators.find(collab => collab.user_id === parseInt(userId));
        if (userCollaboration) {
          isCollaborator = true;
          collaboratorRole = userCollaboration.role;
        }
      } catch (error) {
        console.log('Could not fetch collaborators:', error);
      }
      
      // Add edit permission info to response
      form.can_edit = isOwner || collaboratorRole === 'editor';
      form.collaborator_role = collaboratorRole;
      form.is_collaborator = isCollaborator;
    } else {
      form.can_edit = false;
      form.collaborator_role = null;
      form.is_collaborator = false;
    }
    
    res.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

  async getFormWithQuestions(formId) {
    const form = await Form.findById(formId);
    if (!form) return null;

    const questions = await Question.findByFormId(formId);
    return {
      ...form,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        is_required: q.is_required,
        options: q.options,
        order_index: q.order_index,
        image_url: q.image_url,
      })),
    };
  },

  async getUserForms(req, res) {
    try {
      const userId = req.user.userId;
      const forms = await Form.findByUser(userId);

      const formsWithStats = await Promise.all(
        forms.map(async (form) => {
          const responseCount = await Response.getResponseCount(form.id);
          const completionRate = await Form.getCompletionRate(form.id);
          const lastResponse = await Form.getLastResponseDate(form.id);
          
          // ✅ Use the user_role from the query result
          const userRole = form.user_role;
          const isOwner = userRole === 'owner';
          const isCollaborator = !isOwner && (userRole === 'editor' || userRole === 'viewer');
          
          return {
            ...form,
            response_count: responseCount,
            completion_rate: completionRate,
            last_response: lastResponse,
            // ✅ Include collaborator information
            collaborator_role: isCollaborator ? userRole : null,
            is_collaborator: isCollaborator,
            can_edit: isOwner || userRole === 'editor'
          };
        })
      );

      res.json({ forms: formsWithStats });
    } catch (error) {
      console.error('Get user forms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateForm(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;
      const updates = req.body;

      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      // Handle question updates with images
      if (updates.questions && Array.isArray(updates.questions)) {
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // Get existing questions to compare
          const existingQuestions = await Question.findByFormId(formId);
          const existingQuestionIds = existingQuestions.map(q => q.id);
          
          // Extract IDs from incoming questions (they might be new or existing)
          const incomingQuestionIds = updates.questions
            .map(q => q.id)
            .filter(id => id && typeof id === 'number');

          // Find questions to delete (exist in DB but not in incoming data)
          const questionsToDelete = existingQuestionIds.filter(
            id => !incomingQuestionIds.includes(id)
          );

          // Delete answers for questions that will be removed
          if (questionsToDelete.length > 0) {
            await client.query(
              'DELETE FROM answers WHERE question_id = ANY($1)',
              [questionsToDelete]
            );
          }

          // Now delete the questions
          if (questionsToDelete.length > 0) {
            await client.query(
              'DELETE FROM questions WHERE id = ANY($1) AND form_id = $2',
              [questionsToDelete, formId]
            );
          }

          // Update or create remaining questions
          for (let i = 0; i < updates.questions.length; i++) {
            const q = updates.questions[i];
            const questionData = {
              form_id: formId,
              text: q.text,
              type: q.type,
              is_required: q.is_required || false,
              options: q.options || [],
              order_index: i,
              image_url: q.image_url || null,
            };

            if (q.id && existingQuestionIds.includes(q.id)) {
              // Update existing question
              await client.query(
                `UPDATE questions 
                 SET text = $1, type = $2, is_required = $3, options = $4, order_index = $5, image_url = $6 
                 WHERE id = $7 AND form_id = $8`,
                [
                  questionData.text,
                  questionData.type,
                  questionData.is_required,
                  JSON.stringify(questionData.options),
                  questionData.order_index,
                  questionData.image_url,
                  q.id,
                  formId
                ]
              );
            } else {
              // Create new question
              await client.query(
                `INSERT INTO questions (form_id, text, type, is_required, options, order_index, image_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  questionData.form_id,
                  questionData.text,
                  questionData.type,
                  questionData.is_required,
                  JSON.stringify(questionData.options),
                  questionData.order_index,
                  questionData.image_url
                ]
              );
            }
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        
        // Remove questions from updates since we handled them separately
        const { questions, ...formUpdates } = updates;
        if (Object.keys(formUpdates).length > 0) {
          await Form.update(formId, formUpdates);
        }
      } else {
        // Regular form updates (title, description, etc.)
        await Form.update(formId, updates);
      }

      // Return the updated form with questions
      const updatedForm = await formController.getFormWithQuestions(formId);
      res.json({ message: 'Form updated successfully', form: updatedForm });
    } catch (error) {
      console.error('Update form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteForm(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;

      const isOwner = await Form.isOwner(formId, userId);
      if (!isOwner) return res.status(403).json({ error: 'Only form owner can delete the form' });

      await Form.delete(formId);
      res.json({ message: 'Form deleted successfully' });
    } catch (error) {
      console.error('Delete form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async addCollaborator(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;
      const { collaborator_email, role } = req.body;

      const isOwner = await Form.isOwner(formId, userId);
      if (!isOwner) return res.status(403).json({ error: 'Only form owner can add collaborators' });

      const collaborator = await User.findByEmail(collaborator_email);
      if (!collaborator) return res.status(404).json({ error: 'User not found' });
      if (collaborator.id === userId) return res.status(400).json({ error: 'Cannot add yourself as collaborator' });

      const collaboratorRecord = await Form.addCollaborator(formId, collaborator.id, role);
      res.status(201).json({
        message: 'Collaborator added successfully',
        collaborator: {
          id: collaboratorRecord.id,
          user_id: collaborator.id,
          name: collaborator.name,
          email: collaborator.email,
          role: collaboratorRecord.role,
        },
      });
    } catch (error) {
      console.error('Add collaborator error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async removeCollaborator(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;
      const { collaboratorId } = req.params;

      const isOwner = await Form.isOwner(formId, userId);
      if (!isOwner) return res.status(403).json({ error: 'Only form owner can remove collaborators' });

      const result = await Form.removeCollaborator(formId, collaboratorId);
      res.json({ message: 'Collaborator removed successfully', result });
    } catch (error) {
      console.error('Remove collaborator error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getCollaborators(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;

      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      const collaborators = await Form.getCollaborators(formId);
      res.json({ collaborators });
    } catch (error) {
      console.error('Get collaborators error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async toggleFormLock(req, res) {
    try {
      const formId = req.params.id;
      const userId = req.user.userId;
      const { is_locked } = req.body;

      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      const form = await Form.update(formId, { is_locked });
      res.json({ message: `Form ${is_locked ? 'locked' : 'unlocked'} successfully`, form });
    } catch (error) {
      console.error('Toggle form lock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};