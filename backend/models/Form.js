// Form.js - COMPLETE FIXED VERSION
import pool from '../config/database.js';

export class Form {
  static async create({ title, description, allow_unauthenticated, created_by }) {
    const result = await pool.query(
      `INSERT INTO forms (title, description, allow_unauthenticated, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description, allow_unauthenticated || false, created_by]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM forms WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await pool.query(
      `SELECT 
         f.*,
         CASE 
           WHEN f.created_by = $1 THEN 'owner'
           ELSE c.role
         END as user_role,
         c.role as collaborator_role
       FROM forms f
       LEFT JOIN collaborators c ON f.id = c.form_id AND c.user_id = $1
       WHERE f.created_by = $1 OR c.user_id = $1
       ORDER BY f.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async update(id, updates) {
    const allowedFields = ['title', 'description', 'allow_unauthenticated', 'is_locked'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE forms SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      console.log('Starting form deletion process for form ID:', id);

      // Delete in correct order to respect foreign key constraints
      // 1. First delete answers (depends on responses and questions)
      console.log('Deleting answers...');
      await client.query(
        'DELETE FROM answers WHERE response_id IN (SELECT id FROM responses WHERE form_id = $1)',
        [id]
      );

      // 2. Delete responses (depends on forms)
      console.log('Deleting responses...');
      await client.query(
        'DELETE FROM responses WHERE form_id = $1',
        [id]
      );

      // 3. Delete questions (depends on forms)
      console.log('Deleting questions...');
      await client.query(
        'DELETE FROM questions WHERE form_id = $1',
        [id]
      );

      // 4. Delete collaborators (depends on forms)
      console.log('Deleting collaborators...');
      await client.query(
        'DELETE FROM collaborators WHERE form_id = $1',
        [id]
      );

      // 5. Finally delete the form
      console.log('Deleting form...');
      const result = await client.query(
        'DELETE FROM forms WHERE id = $1 RETURNING *',
        [id]
      );

      await client.query('COMMIT');
      console.log('Form deletion completed successfully');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Form deletion transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async addCollaborator(formId, userId, role) {
    const result = await pool.query(
      `INSERT INTO collaborators (form_id, user_id, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (form_id, user_id) 
       DO UPDATE SET role = $3, created_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [formId, userId, role]
    );
    return result.rows[0];
  }

  static async removeCollaborator(formId, userId) {
    const result = await pool.query(
      'DELETE FROM collaborators WHERE form_id = $1 AND user_id = $2 RETURNING *',
      [formId, userId]
    );
    return result.rows[0];
  }

  static async getCollaborators(formId) {
    const result = await pool.query(
      `SELECT c.*, u.name, u.email 
       FROM collaborators c
       JOIN users u ON c.user_id = u.id
       WHERE c.form_id = $1`,
      [formId]
    );
    return result.rows;
  }

  static async isOwner(formId, userId) {
    const result = await pool.query(
      'SELECT 1 FROM forms WHERE id = $1 AND created_by = $2',
      [formId, userId]
    );
    return result.rows.length > 0;
  }

  static async hasAccess(formId, userId) {
    const result = await pool.query(
      `SELECT 1 FROM forms f 
       LEFT JOIN collaborators c ON f.id = c.form_id 
       WHERE f.id = $1 AND (f.created_by = $2 OR c.user_id = $2)`,
      [formId, userId]
    );
    return result.rows.length > 0;
  }

  static async getCompletionRate(formId) {
    try {
      const questionCountResult = await pool.query(
        `SELECT COUNT(*) AS question_count FROM questions WHERE form_id = $1`,
        [formId]
      );
      const totalQuestions = parseInt(questionCountResult.rows[0]?.question_count || 0);
      
      if (totalQuestions === 0) return 0;

      const completionResult = await pool.query(
        `WITH response_answers AS (
           SELECT 
             r.id as response_id,
             COUNT(a.id) as answered_count
           FROM responses r
           LEFT JOIN answers a ON r.id = a.response_id 
             AND (a.answer_text IS NOT NULL OR a.answer_options IS NOT NULL)
           WHERE r.form_id = $1
           GROUP BY r.id
         )
         SELECT 
           COUNT(*) as total_responses,
           AVG(answered_count * 100.0 / $2) as avg_completion_rate
         FROM response_answers`,
        [formId, totalQuestions]
      );

      const totalResponses = parseInt(completionResult.rows[0]?.total_responses || 0);
      const avgCompletionRate = parseFloat(completionResult.rows[0]?.avg_completion_rate || 0);

      if (totalResponses === 0) return 0;

      return Math.min(Math.round(avgCompletionRate), 100);
      
    } catch (error) {
      console.error('Error calculating completion rate:', error);
      return 0;
    }
  }

  static async getLastResponseDate(formId) {
    try {
      const result = await pool.query(
        `SELECT submitted_at 
         FROM responses 
         WHERE form_id = $1 
         ORDER BY submitted_at DESC 
         LIMIT 1`,
        [formId]
      );
      
      return result.rows[0]?.submitted_at || null;
    } catch (error) {
      console.error('Error getting last response date:', error);
      return null;
    }
  }

  static async getFormWithQuestions(formId) {
    const formResult = await pool.query(
      `SELECT * FROM forms WHERE id = $1`,
      [formId]
    );

    const form = formResult.rows[0];
    if (!form) return null;

    const questionsResult = await pool.query(
      `SELECT * FROM questions WHERE form_id = $1 ORDER BY created_at ASC`,
      [formId]
    );

    form.questions = questionsResult.rows;
    return form;
  }

  // ✅ NEW: Get user's role for a specific form
  static async getUserRole(formId, userId) {
    try {
      // Check if user is owner
      const isOwner = await Form.isOwner(formId, userId);
      if (isOwner) return 'owner';
      
      // Check if user is collaborator and get role
      const result = await pool.query(
        'SELECT role FROM collaborators WHERE form_id = $1 AND user_id = $2',
        [formId, userId]
      );
      
      return result.rows[0]?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}