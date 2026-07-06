'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { requireMinLevel } = require('../middlewares/requireMinLevel');
const { requirePermission } = require('../middlewares/requirePermission');

const ADMIN = 4;       // Admin or Super Admin
const SUPER_ADMIN = 5; // Super Admin only

// List every user (the Manage Users table).
router.get('/users', protect, requireMinLevel(ADMIN), adminController.listUsers);

// Exact-username lookup (the +Add Admin search bar).
router.get('/users/search', protect, requireMinLevel(ADMIN), adminController.searchByUsername);

router.patch('/users/:id/role', protect, requireMinLevel(SUPER_ADMIN), adminController.changeUserRole);

// Create a new Admin account with a one-time password (emailed + returned once).
router.post('/users', protect, requireMinLevel(SUPER_ADMIN), adminController.createUser);

// Enable/disable an account (the active/inactive toggle).
router.patch('/users/:id/status', protect, requireMinLevel(ADMIN), adminController.setStatus);

router.get(
  '/metrics',
  protect,
  requireMinLevel(ADMIN),
  requirePermission('view_analytics'),
  adminController.getMetrics
);

router.get(
  '/permissions',
  protect,
  requireMinLevel(SUPER_ADMIN),
  requirePermission('manage_roles'),
  adminController.listPermissions
);

router.get(
  '/roles',
  protect,
  requireMinLevel(SUPER_ADMIN),
  requirePermission('manage_roles'),
  adminController.listRolesWithPermissions
);

router.post(
  '/roles/:id/permissions/:permKey',
  protect,
  requireMinLevel(SUPER_ADMIN),
  requirePermission('manage_roles'),
  adminController.grantPermission
);

router.delete(
  '/roles/:id/permissions/:permKey',
  protect,
  requireMinLevel(SUPER_ADMIN),
  requirePermission('manage_roles'),
  adminController.revokePermission
);

module.exports = router;