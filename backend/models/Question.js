import pool from '../config/database.js';

export class Question {
  // CREATE a single question
  static async create({ form_id, text, type, is_required, options, order_index, image_url }) {
    const optionsJson = JSON.stringify(options || []);

    const result = await pool.query(
      `INSERT INTO questions (form_id, text, type, is_required, options, order_index, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [form_id, text, type, is_required || false, optionsJson, order_index || 0, image_url || null]
    );

    const question = result.rows[0];
    question.options = Question.parseOptions(question.options);
    return question;
  }

  // CREATE multiple questions in a batch
  static async createBatch(questions) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const createdQuestions = [];
      for (const question of questions) {
        const optionsJson = JSON.stringify(question.options || []);

        const result = await client.query(
          `INSERT INTO questions (form_id, text, type, is_required, options, order_index, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            question.form_id,
            question.text,
            question.type,
            question.is_required || false,
            optionsJson,
            question.order_index || 0,
            question.image_url || null
          ]
        );

        const q = result.rows[0];
        q.options = Question.parseOptions(q.options);
        createdQuestions.push(q);
      }

      await client.query('COMMIT');
      return createdQuestions;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // GET all questions for a given form
  static async findByFormId(formId) {
    const result = await pool.query(
      'SELECT * FROM questions WHERE form_id = $1 ORDER BY order_index',
      [formId]
    );

    return result.rows.map(question => ({
      ...question,
      options: Question.parseOptions(question.options)
    }));
  }

  // UPDATE a question
  static async update(id, updates) {
    const allowedFields = ['text', 'type', 'is_required', 'options', 'order_index', 'image_url'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        const processedValue = field === 'options' ? JSON.stringify(value || []) : value;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(processedValue);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE questions SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows[0]) {
      result.rows[0].options = Question.parseOptions(result.rows[0].options);
    }

    return result.rows[0];
  }

  // DELETE a question
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  // REORDER questions for a form
  static async reorderQuestions(formId, questionOrder) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < questionOrder.length; i++) {
        await client.query(
          'UPDATE questions SET order_index = $1 WHERE id = $2 AND form_id = $3',
          [i, questionOrder[i], formId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // HELPER: safely parse options JSON
  static parseOptions(options) {
    if (!options) return [];

    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing options JSON:', error);
        return [];
      }
    }

    if (Array.isArray(options)) return options;
    return [];
  }
}