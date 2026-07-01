'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/auth/register  — create account + verification token
router.post('/register', authController.register);

// POST /api/auth/login     — exchange credentials for a JWT
router.post('/login', authController.login);

// GET  /api/auth/verify-email?token=...  — consume token, mark email verified
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/logout          — client discards token; server confirms
router.post('/logout', protect, authController.logout);

// POST /api/auth/change-password — logged-in user sets a new password
router.post('/change-password', protect, authController.changePassword);

// POST /api/auth/forgot-password — request a reset link
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password  — consume token, set new password
router.post('/reset-password', authController.resetPassword);

module.exports = router;