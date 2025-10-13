import pool from '../config/database.js';

export class Response {
  static async create({ form_id, user_id }) {
    const result = await pool.query(
      'INSERT INTO responses (form_id, user_id) VALUES ($1, $2) RETURNING *',
      [form_id, user_id]
    );
    
    return result.rows[0];
  }

  static async createWithAnswers(formId, userId, answers) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create response
    const responseResult = await client.query(
      'INSERT INTO responses (form_id, user_id) VALUES ($1, $2) RETURNING *',
      [formId, userId]
    );
    
    const response = responseResult.rows[0];

    // Create answers
    for (const answer of answers) {
      // ✅ FIX: Properly stringify the answer_options array to JSON
      const answerOptionsJson = answer.answerOptions ? JSON.stringify(answer.answerOptions) : null;
      
      await client.query(
        `INSERT INTO answers (response_id, question_id, answer_text, answer_options) 
         VALUES ($1, $2, $3, $4)`,
        [response.id, answer.questionId, answer.answerText, answerOptionsJson]
      );
    }

    await client.query('COMMIT');
    return response;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  static async findByFormId(formId) {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name,
              json_agg(
                json_build_object(
                  'question_id', a.question_id,
                  'question_text', q.text,
                  'question_type', q.type,
                  'answer_text', a.answer_text,
                  'answer_options', a.answer_options
                )
              ) as answers
       FROM responses r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN answers a ON r.id = a.response_id
       LEFT JOIN questions q ON a.question_id = q.id
       WHERE r.form_id = $1
       GROUP BY r.id, u.name
       ORDER BY r.submitted_at DESC`,
      [formId]
    );
    
    return result.rows;
  }

  static async getResponseCount(formId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM responses WHERE form_id = $1',
      [formId]
    );
    
    return parseInt(result.rows[0].count);
  }

  static async getAnswerStats(formId, questionId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN a.answer_text IS NOT NULL OR a.answer_options IS NOT NULL THEN 1 END) as answered,
         json_agg(
           CASE 
             WHEN a.answer_text IS NOT NULL THEN json_build_object('type', 'text', 'value', a.answer_text)
             WHEN a.answer_options IS NOT NULL THEN json_build_object('type', 'options', 'value', a.answer_options)
           END
         ) as answers
       FROM answers a
       JOIN responses r ON a.response_id = r.id
       WHERE r.form_id = $1 AND a.question_id = $2`,
      [formId, questionId]
    );
    
    return result.rows[0];
  }
}