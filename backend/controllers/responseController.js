import { Form } from '../models/Form.js';
import { Response } from '../models/Response.js';
import { Question } from '../models/Question.js';
import XLSX from 'xlsx';

// Helper function to get formId from either parameter name
const getFormId = (req) => {
  return req.params.id || req.params.formId;
};

export const responseController = {
  async submitResponse(req, res) {
    try {
      const formId = getFormId(req);
      const { answers } = req.body;
      const userId = req.user?.userId || null;

      console.log('Debug submit - Form ID:', formId, 'User ID:', userId, 'Answers:', answers);

      // Check if form exists and is not locked
      const form = await Form.findById(formId);
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      if (form.is_locked) {
        return res.status(423).json({ error: 'Form is locked and not accepting responses' });
      }

      // Check authentication requirement
      if (!form.allow_unauthenticated && !userId) {
        return res.status(401).json({ error: 'Authentication required to submit this form' });
      }

      // Get form questions for validation
      const questions = await Question.findByFormId(formId);
      console.log('Debug submit - Questions:', questions);

      // Validate answers
      const validationErrors = [];
      for (const question of questions) {
        if (question.is_required) {
          const answer = answers.find(a => a.questionId === question.id);
          if (!answer || 
              (answer.answerText === '' && 
               (!answer.answerOptions || 
                (Array.isArray(answer.answerOptions) && answer.answerOptions.length === 0)))) {
            validationErrors.push(`Question "${question.text}" is required`);
          }
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors
        });
      }

      // Create response with answers
      const response = await Response.createWithAnswers(formId, userId, answers);
      console.log('Debug submit - Response created:', response);

      res.status(201).json({
        message: 'Response submitted successfully',
        response_id: response.id
      });
    } catch (error) {
      console.error('Submit response error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getFormResponses(req, res) {
    try {
      const formId = parseInt(getFormId(req));
      const userId = parseInt(req.user.userId);

      console.log('Debug - Form ID:', formId, 'User ID:', userId);

      // Check if form exists first
      const form = await Form.findById(formId);
      if (!form) {
        console.log('Debug - Form not found');
        return res.status(404).json({ error: 'Form not found' });
      }

      // Check if user has access to form
      const hasAccess = await Form.hasAccess(formId, userId);
      console.log('Debug - Has access:', hasAccess);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this form' });
      }

      const responses = await Response.findByFormId(formId);
      console.log('Debug - Responses count:', responses.length);

      res.json(responses);
    } catch (error) {
      console.error('Get form responses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getResponseStats(req, res) {
    try {
      const formId = parseInt(getFormId(req));
      const userId = parseInt(req.user.userId);

      // Check if form exists
      const form = await Form.findById(formId);
      if (!form) return res.status(404).json({ error: 'Form not found' });

      // Check access
      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

      const responses = await Response.findByFormId(formId);
      const responseCount = responses.length;
      const questions = await Question.findByFormId(formId);

      console.log('=== DEBUG: Raw responses data ===');
      console.log('Responses count:', responses.length);
      console.log('Questions count:', questions.length);
      
      responses.forEach((response, index) => {
        console.log(`\nResponse ${index + 1} (ID: ${response.id}):`);
        console.log('Answers array:', response.answers);
        console.log('Answers length:', response.answers ? response.answers.length : 0);
        
        if (response.answers && response.answers.length > 0) {
          response.answers.forEach((answer, ansIndex) => {
            console.log(`  Answer ${ansIndex + 1}:`, {
              question_id: answer.question_id,
              answer_text: answer.answer_text,
              answer_options: answer.answer_options,
              has_text: !!(answer.answer_text && answer.answer_text.trim().length > 0),
              has_options: !!(answer.answer_options && 
                (Array.isArray(answer.answer_options) ? answer.answer_options.length > 0 : answer.answer_options.toString().trim().length > 0))
            });
          });
        }
      });
      console.log('=== END DEBUG ===');

      // Calculate completion rate for EACH response
      const responsesWithCompletion = responses.map(response => {
        let answeredQuestions = 0;
        
        questions.forEach(question => {
          const answer = response.answers.find(a => a && a.question_id === question.id);
          
          if (answer) {
            // FIX: More strict answer detection
            const hasAnswerText = answer.answer_text && answer.answer_text.trim().length > 0;
            const hasAnswerOptions = answer.answer_options && 
              (Array.isArray(answer.answer_options) ? answer.answer_options.length > 0 : answer.answer_options.toString().trim().length > 0);
            
            // Only count as answered if at least one field has actual content
            if (hasAnswerText || hasAnswerOptions) {
              answeredQuestions++;
              console.log(`✅ Response ${response.id}: Question ${question.id} COUNTED as answered - Text: "${answer.answer_text}", Options:`, answer.answer_options);
            } else {
              console.log(`❌ Response ${response.id}: Question ${question.id} NOT counted - Text: "${answer.answer_text}", Options:`, answer.answer_options);
            }
          } else {
            console.log(`❌ Response ${response.id}: Question ${question.id} - NO ANSWER FOUND`);
          }
        });
        
        const completionRate = (answeredQuestions / questions.length) * 100;
        console.log(`📊 Response ${response.id}: ${answeredQuestions}/${questions.length} questions answered = ${completionRate}%`);
        
        return {
          response_id: response.id,
          user_name: response.user_name || 'Anonymous',
          submitted_at: response.submitted_at,
          answered_questions: answeredQuestions,
          total_questions: questions.length,
          completion_rate: parseFloat(completionRate.toFixed(1))
        };
      });

      // Calculate overall average completion rate
      const totalCompletionRate = responsesWithCompletion.length > 0 
        ? responsesWithCompletion.reduce((sum, response) => sum + response.completion_rate, 0) / responsesWithCompletion.length
        : 0;

      console.log(`🎯 Overall average completion rate: ${totalCompletionRate}%`);

      res.json({
        form_id: formId,
        total_responses: responseCount,
        total_questions: questions.length,
        average_completion_rate: parseFloat(totalCompletionRate.toFixed(1)),
        individual_responses: responsesWithCompletion
      });
    } catch (error) {
      console.error('Get response stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async exportResponses(req, res) {
    try {
      const formId = parseInt(getFormId(req));
      const userId = parseInt(req.user.userId);

      // Check if form exists first
      const form = await Form.findById(formId);
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      // Check if user has access to form
      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const questions = await Question.findByFormId(formId);
      const responses = await Response.findByFormId(formId);

      // Create Excel workbook
      const wb = XLSX.utils.book_new();

      // Create responses sheet with safe data handling
      const responseData = responses.map(response => {
        const row = {
          'Response ID': response.id,
          'User': response.user_name || 'Anonymous',
          'Submitted At': new Date(response.submitted_at).toLocaleString()
        };

        questions.forEach(question => {
          const answer = response.answers.find(a => a.question_id === question.id);
          
          if (!answer) {
            row[question.text] = '';
            return;
          }

          // Handle different answer types safely
          if (answer.answer_text) {
            // Special handling for image data
            if (question.type === 'image' && answer.answer_text.startsWith('data:image')) {
              row[question.text] = `[Image ${response.id}-${question.id}]`;
            } 
            // Handle very long text (like base64)
            else if (answer.answer_text.length > 30000) {
              row[question.text] = `[Data too long: ${answer.answer_text.length} chars]`;
            }
            // Handle normal text with safe truncation
            else if (answer.answer_text.length > 32700) {
              row[question.text] = answer.answer_text.substring(0, 32000) + '... [truncated]';
            }
            else {
              row[question.text] = answer.answer_text;
            }
          } 
          else if (answer.answer_options) {
            row[question.text] = Array.isArray(answer.answer_options) 
              ? answer.answer_options.join(', ') 
              : String(answer.answer_options);
          }
          else {
            row[question.text] = '';
          }
        });

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(responseData);
      
      // Set column widths for better readability
      const colWidths = questions.map(() => ({ wch: 20 }));
      ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, ...colWidths];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Responses');

      // Create question info sheet
      const questionInfo = questions.map(q => ({
        'Question ID': q.id,
        'Question Text': q.text,
        'Type': q.type,
        'Required': q.is_required ? 'Yes' : 'No',
        'Options': Array.isArray(q.options) ? q.options.join('; ') : ''
      }));

      const questionWs = XLSX.utils.json_to_sheet(questionInfo);
      XLSX.utils.book_append_sheet(wb, questionWs, 'Questions');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { 
        type: 'buffer', 
        bookType: 'xlsx'
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-responses-${Date.now()}.xlsx"`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('Export responses error:', error);
      
      // More specific error handling
      if (error.message.includes('Text length must not exceed')) {
        res.status(500).json({ 
          error: 'Data too large for Excel export. Some responses contain very long text or images.' 
        });
      } else {
        res.status(500).json({ error: 'Internal server error during export' });
      }
    }
  },

  async getIndividualResponse(req, res) {
    try {
      const formId = parseInt(getFormId(req));
      const { responseId } = req.params;
      const userId = parseInt(req.user.userId);

      // Check if form exists first
      const form = await Form.findById(formId);
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      // Check if user has access to form
      const hasAccess = await Form.hasAccess(formId, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const responses = await Response.findByFormId(formId);
      const response = responses.find(r => r.id === parseInt(responseId));

      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }

      res.json({ response });
    } catch (error) {
      console.error('Get individual response error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};