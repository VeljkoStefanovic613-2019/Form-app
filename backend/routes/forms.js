// forms.js - CORRECTED version
import express from 'express';
import { formController } from '../controllers/formController.js';
import { responseController } from '../controllers/responseController.js';
import { validateForm } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ✅ PUBLIC ROUTES (no authentication required for these)
router.get('/:id', optionalAuth, formController.getForm);
router.post('/:id/responses', optionalAuth, responseController.submitResponse);

// ✅ PROTECTED ROUTES (require authentication for everything below)
router.use(authenticateToken);

// Form management routes
router.get('/', formController.getUserForms);
router.post('/', validateForm, formController.createForm);
router.put('/:id', validateForm, formController.updateForm);
router.delete('/:id', formController.deleteForm);
router.patch('/:id/lock', formController.toggleFormLock);

// Collaborator routes
router.post('/:id/collaborators', formController.addCollaborator);
router.delete('/:id/collaborators/:collaboratorId', formController.removeCollaborator);
router.get('/:id/collaborators', formController.getCollaborators);

// Response viewing/export routes (protected - only form owners/collaborators)
router.get('/:id/responses', responseController.getFormResponses);
router.get('/:id/responses/export', responseController.exportResponses);
router.get('/:id/responses/stats', responseController.getResponseStats);
router.get('/:id/responses/:responseId', responseController.getIndividualResponse);

export default router;