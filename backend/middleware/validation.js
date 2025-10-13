export const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  next();
};

export const validateForm = (req, res, next) => {
  const { title, questions } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Form title is required' });
  }

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Questions array is required' });
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question.text || question.text.trim().length === 0) {
      return res.status(400).json({ error: `Question ${i + 1} text is required` });
    }

    const validTypes = ['text', 'textarea', 'radio', 'checkbox', 'select', 'email', 'number', 'number_range', 'date', 'time', 'image'];
    if (!validTypes.includes(question.type)) {
      return res.status(400).json({ error: `Invalid question type for question ${i + 1}` });
    }

    if (['radio', 'checkbox', 'select'].includes(question.type)) {
      if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        return res.status(400).json({ error: `Options are required for ${question.type} questions` });
      }
    }
  }

  next();
};