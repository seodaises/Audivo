'use strict';
const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

// GET /api/admin/users?page=&limit=
const listUsers = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await adminService.listUsers({ page, limit });
  return success(res, 200, 'Users retrieved', result);
});

// GET /api/admin/users/search?username=
const searchByUsername = catchAsync(async (req, res) => {
  const { username } = req.query;
  if (!username) throw new ApiError(400, 'username query param is required');

  const result = await adminService.findByUsername({ username });
  return success(res, 200, 'User found', result);
});

// PATCH /api/admin/users/:id/role   body: { role: "Admin" }
const changeUserRole = catchAsync(async (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body || {};
  if (!role) throw new ApiError(400, 'role is required');

  const result = await adminService.changeUserRole({
    actor: req.user,          // carries id + level (set by protect + requireMinLevel)
    targetUserId,
    newRoleName: role,
  });
  return success(res, 200, 'User role updated', result);
});

// POST /api/admin/users   body: { email, displayName, username }
const createUser = catchAsync(async (req, res) => {
  const { email, displayName, username } = req.body || {};
  const result = await adminService.createUser({
    actor: req.user,
    email,
    displayName,
    username,
  });
  return success(res, 201, 'Admin account created', result);
});

// PATCH /api/admin/users/:id/status   body: { isActive: boolean }
const setStatus = catchAsync(async (req, res) => {
  const targetUserId = req.params.id;
  const { isActive } = req.body || {};

  // Must be a real boolean — guards against "true" (string) or a missing field.
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be true or false');
  }

  const result = await adminService.setUserStatus({
    actor: req.user,
    targetUserId,
    isActive,
  });
  return success(res, 200, isActive ? 'User activated' : 'User deactivated', result);
});

module.exports = {
  listUsers,
  searchByUsername,
  changeUserRole,
  createUser,
  setStatus,
};