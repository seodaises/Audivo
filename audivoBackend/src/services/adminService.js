'use strict';
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { hashPassword, generateTempPassword } = require('../utils/password');
const { sendTempPasswordEmail } = require('./emailService');

const MAX_ASSIGNABLE_LEVEL = 4; // Admin
const CREATABLE_ROLES = ['Admin']; 
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// Shared projection for a user row in admin views. Now carries the fields the
// Manage Users table shows: email, phone, and the active flag.
const adminUserRow = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  displayName: user.display_name,
  phoneNumber: user.phone_number ?? null,
  role: user.role ? user.role.name : null,
  roleLevel: user.role ? user.role.level : null,
  isActive: user.is_active,
  gender: user.gender ?? null,
  birthday: user.birthday ?? null,
  addressStreet: user.address_street ?? null,
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
  
const createUser = async ({ actor, email, displayName, username, role = 'Admin' }) => {
  const cleanEmail = String(email || '').trim();
  const cleanName = String(displayName || '').trim();
  const cleanUsername = String(username || '').trim().toLowerCase();

  if (!cleanEmail) throw new ApiError(400, 'email is required');
  if (!cleanName) throw new ApiError(400, 'displayName is required');

  if (!CREATABLE_ROLES.includes(role)) {
    throw new ApiError(403, 'That role cannot be created through this dashboard');
  }
  if (!USERNAME_RE.test(cleanUsername)) {
    throw new ApiError(
      400,
      'username must be 3-20 characters: lowercase letters, numbers, or underscores'
    );
  }

  // Friendly pre-checks; the DB unique indexes are the real guarantee.
  const emailTaken = await db.User.findOne({ where: { email: cleanEmail } });
  if (emailTaken) throw new ApiError(409, 'Email already registered');

  const usernameTaken = await db.User.findOne({ where: { username: cleanUsername } });
  if (usernameTaken) throw new ApiError(409, 'Username already taken');

  const roleRow = await db.Role.findOne({ where: { name: role } });
  if (!roleRow) throw new ApiError(500, 'Role not configured');

  const tempPassword = generateTempPassword();
  const password_hash = await hashPassword(tempPassword);

  const created = await db.User.create({
    email: cleanEmail,
    password_hash,
    display_name: cleanName,
    username: cleanUsername,
    role_id: roleRow.id,
    must_change_password: true,     // forced change on first login
    email_verified_at: new Date(),  // Super Admin vouches for the address
  });

  // Email the one-time credentials. Dev (no SMTP) returns { sent:false, loginUrl }
  // and logs to console — matching your other mailers.
  const emailDelivery = await sendTempPasswordEmail({
    to: created.email,
    tempPassword,
    displayName: created.display_name,
  });

  return {
    user: {
      id: created.id,
      email: created.email,
      username: created.username,
      displayName: created.display_name,
      role: roleRow.name,
      mustChangePassword: created.must_change_password,
    },
    tempPassword,   // returned ONCE so the Super Admin sees it on screen too
    emailDelivery,
  };
};


const setUserStatus = async ({ actor, targetUserId, isActive }) => {
  if (Number(actor.id) === Number(targetUserId)) {
    throw new ApiError(403, 'You cannot change your own status');
  }

  const target = await db.User.findByPk(targetUserId, {
    include: [{ model: db.Role, as: 'role' }],
  });
  if (!target) throw new ApiError(404, 'Target user not found');

  // Strict-higher rule — mirrors changeUserRole.
  if (!(actor.level > target.role.level)) {
    throw new ApiError(403, 'You cannot modify a user at or above your own level');
  }

  target.is_active = isActive;
  await target.save();

  return adminUserRow(target);
};
module.exports = {
  listUsers,
  findByUsername,
  changeUserRole,
  createUser,
  setUserStatus,
};