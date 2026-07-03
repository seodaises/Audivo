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

module.exports = {
  listUsers,
  searchByUsername,
  changeUserRole,
};