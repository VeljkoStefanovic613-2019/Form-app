import express from 'express';
import { responseController } from '../controllers/responseController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Only keep the form submission route (public access)
// This uses :formId parameter which matches the submitResponse method
router.post('/:formId/responses', optionalAuth, responseController.submitResponse);

export default router;