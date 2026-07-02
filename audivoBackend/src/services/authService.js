'use strict';
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail, sendResetPasswordEmail } = require('./emailService');
const {
  generateVerificationToken,
  expiryFromNow,
  hashToken,
} = require('../utils/verificationToken');

const register = async ({ email, password, displayName }) => {
  const existing = await db.User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const listener = await db.Role.findOne({ where: { name: 'Listener' } });
  if (!listener) {
    throw new ApiError(500, 'Default role not configured');
  }

  const password_hash = await hashPassword(password);

  const user = await db.User.create({
    email,
    password_hash,
    display_name: displayName,
    role_id: listener.id,
    // email_verified_at stays NULL — unverified until they click the link
  });

  const token = generateVerificationToken();
  await db.EmailVerificationToken.create({
    user_id: user.id,
    token,
    expires_at: expiryFromNow(24),
  });

  const emailDelivery = await sendVerificationEmail({
    to: user.email,
    token,
  });

  // `verificationToken` is returned ONLY so you can test verify in Postman
  // before SMTP exists. Remove this field once real email sending is wired.
  return {
    user: publicUser(user),
    emailDelivery,
    verificationToken: token, // TODO: remove once email send is live
  };
};

const login = async ({ email, password, ipAddress, userAgent }) => {
  const user = await db.User.findOne({
    where: { email },
    include: [{ model: db.Role, as: 'role' }],
  });

  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  if (!user.is_active) throw new ApiError(403, 'Account is disabled');

  // Dev-permissive: unverified users may log in unless this flag is turned on.
  if (process.env.REQUIRE_VERIFIED_EMAIL === 'true' && !user.email_verified_at) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  user.last_login_at = new Date();
  await user.save();

  // login_history is the source of truth for "when/where did I sign in"
  await db.LoginHistory.create({
    user_id: user.id,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  const token = generateToken({ sub: user.id, role: user.role.name });
  return { token, user: publicUser(user) };
};

const verifyEmail = async (token) => {
  const record = await db.EmailVerificationToken.findOne({
    where: { token },
    include: [{ model: db.User, as: 'user' }],
  });

  if (!record) {
    throw new ApiError(400, 'Invalid verification token');
  }
  if (record.used_at !== null) {
    throw new ApiError(400, 'Token already used');
  }
  if (record.expires_at < new Date()) {
    throw new ApiError(400, 'Token has expired');
  }

  const now = new Date();
  record.used_at = now;
  await record.save();

  record.user.email_verified_at = now;
  await record.user.save();

  return { verified: true, email: record.user.email };
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const ok = await comparePassword(oldPassword, user.password_hash);
  if (!ok) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Block a no-op change — new must differ from old.
  const same = await comparePassword(newPassword, user.password_hash);
  if (same) {
    throw new ApiError(400, 'New password must be different from the current one');
  }

  user.password_hash = await hashPassword(newPassword);
  await user.save();

  return { changed: true };
};

const forgotPassword = async ({ email }) => {
  const user = await db.User.findOne({ where: { email } });
  if (!user) return { sent: false, url: null };  // never reveal existence

  const rawToken = generateVerificationToken();
  const token_hash = hashToken(rawToken);
  await db.PasswordResetToken.create({
    user_id: user.id, token_hash, expires_at: expiryFromNow(24),
  });
  const mail = await sendResetPasswordEmail({ to: user.email, token: rawToken });
  return { sent: mail.sent, url: mail.resetUrl || null };
};

const resetPassword = async ({ token, newPassword }) => {
  const token_hash = hashToken(token);
  const record = await db.PasswordResetToken.findOne({
    where: { token_hash }, include: [{ model: db.User, as: 'user' }],
  });
  if (!record) throw new ApiError(400, 'Invalid reset token');
  if (record.used_at !== null) throw new ApiError(400, 'Reset token already used');
  if (record.expires_at < new Date()) throw new ApiError(400, 'Reset token has expired');

  const now = new Date();
  record.user.password_hash = await hashPassword(newPassword);
  await record.user.save();
  record.used_at = now; await record.save();

  await db.PasswordResetToken.update(
    { used_at: now },
    { where: { user_id: record.user_id, used_at: null } }
  );
  return { reset: true, email: record.user.email };
};
const getLoginHistory = async ({ userId, limit = 20 }) => {
  const rows = await db.LoginHistory.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
  });
  return rows.map((r) => ({
    id: r.id,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    at: r.created_at,
  }));
};
// Strips sensitive fields — password_hash never leaves the service.
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name,
  roleId: user.role_id,
  role: user.role ? user.role.name : null, // ← add: role NAME, for the frontend
  isActive: user.is_active,
  isVerified: user.email_verified_at !== null,
});

module.exports = { register, login, verifyEmail, changePassword, forgotPassword, resetPassword, getLoginHistory };
