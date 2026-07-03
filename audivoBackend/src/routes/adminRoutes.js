'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { requireMinLevel } = require('../middlewares/requireMinLevel');

// Level thresholds, named for clarity.
const ADMIN = 4;       // Admin or Super Admin
const SUPER_ADMIN = 5; // Super Admin only

// --- MANAGE USERS: Admin (4) and above ---
// List every user (the Manage Users table).
router.get('/users', protect, requireMinLevel(ADMIN), adminController.listUsers);

// Exact-username lookup (the +Add Admin search bar).
router.get('/users/search', protect, requireMinLevel(ADMIN), adminController.searchByUsername);

// --- MANAGE ROLES: Super Admin (5) only ---
// Promote/demote. Gated at Super Admin because assigning Admin requires
// outranking Admin — only a Super Admin can. The service still enforces the
// per-target hierarchy math on top of this coarse gate.
router.patch('/users/:id/role', protect, requireMinLevel(SUPER_ADMIN), adminController.changeUserRole);

module.exports = router;