'use strict';
const db = require('../models');
const ApiError = require('../utils/ApiError');


const MAX_ASSIGNABLE_LEVEL = 4; // Admin

// Shared projection for a user row in admin views. Intentionally lean:
// username + display_name + role (+ id so the frontend can target actions).
const adminUserRow = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.display_name,
  role: user.role ? user.role.name : null,
  roleLevel: user.role ? user.role.level : null,
});

// GET list — paginated. page/limit are clamped to sane bounds so a caller
// can't ask for a million rows.
const listUsers = async ({ page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { count, rows } = await db.User.findAndCountAll({
    include: [{ model: db.Role, as: 'role' }],
    order: [['id', 'ASC']],
    limit: safeLimit,
    offset,
  });

  return {
    users: rows.map(adminUserRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit),
    },
  };
};

// Exact-username lookup for the +Add Admin search bar. Username is normalized
// to lowercase at registration, so we match on the lowercased input.
const findByUsername = async ({ username }) => {
  const handle = String(username || '').trim().toLowerCase();
  if (!handle) throw new ApiError(400, 'username is required');

  const user = await db.User.findOne({
    where: { username: handle },
    include: [{ model: db.Role, as: 'role' }],
  });
  if (!user) throw new ApiError(404, 'No user found with that username');

  return adminUserRow(user);
};

// The core: change a user's role. Enforces both guardrails + the strict-higher
// hierarchy rule. `actor` is req.user (must carry id + level from the guard).
const changeUserRole = async ({ actor, targetUserId, newRoleName }) => {
  // Guardrail 1: no changing your own role.
  if (Number(actor.id) === Number(targetUserId)) {
    throw new ApiError(403, 'You cannot change your own role');
  }

  const newRole = await db.Role.findOne({ where: { name: newRoleName } });
  if (!newRole) throw new ApiError(400, 'Unknown role');

  // Guardrail 2: cap what can be assigned at Admin and below.
  if (newRole.level > MAX_ASSIGNABLE_LEVEL) {
    throw new ApiError(403, 'That role cannot be assigned through this dashboard');
  }

  const target = await db.User.findByPk(targetUserId, {
    include: [{ model: db.Role, as: 'role' }],
  });
  if (!target) throw new ApiError(404, 'Target user not found');

  // Strict-higher rule: actor must outrank BOTH the target's current role
  // AND the role being granted.
  if (!(actor.level > target.role.level)) {
    throw new ApiError(403, 'You cannot modify a user at or above your own level');
  }
  if (!(actor.level > newRole.level)) {
    throw new ApiError(403, 'You cannot assign a role at or above your own level');
  }

  // No-op guard: nothing to do if they're already that role.
  if (target.role_id === newRole.id) {
    throw new ApiError(400, 'User already has that role');
  }

  target.role_id = newRole.id;
  await target.save();

  // Re-load with the new role for an accurate response row.
  const updated = await db.User.findByPk(target.id, {
    include: [{ model: db.Role, as: 'role' }],
  });
  return adminUserRow(updated);
};

module.exports = {
  listUsers,
  findByUsername,
  changeUserRole,
};