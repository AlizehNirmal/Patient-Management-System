const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { getMe, updateMe } = require('../controllers/patient.controller');

router.get('/me', authenticate, requireRole('PATIENT'), getMe);
router.put('/me', authenticate, requireRole('PATIENT'), updateMe);

module.exports = router;