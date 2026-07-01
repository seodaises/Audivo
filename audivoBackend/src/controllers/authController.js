'use strict';
const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    throw new ApiError(400, 'email, password, and displayName are required');
  }

  const result = await authService.register({ email, password, displayName });
  return success(res, 201, 'Registration successful', result);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const result = await authService.login({ email, password });
  return success(res, 200, 'Login successful', result);
});

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw new ApiError(400, 'token is required');
  }

  const result = await authService.verifyEmail(token);
  return success(res, 200, 'Email verified successfully', result);
});

const logout = catchAsync(async (req, res) => {
  return success(res, 200, 'Logged out successfully', null);
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'oldPassword and newPassword are required');
  }

  const result = await authService.changePassword({
    userId: req.user.id,
    oldPassword,
    newPassword,
  });
  return success(res, 200, 'Password changed successfully', result);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'email is required');

  const result = await authService.forgotPassword({ email });
  // Vague + always 200: never reveal whether the email exists.
  return success(res, 200, 'If that email is registered, a reset link has been sent', {
    devResetUrl: result.url,   // null in production
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new ApiError(400, 'token and newPassword are required');

  const result = await authService.resetPassword({ token, newPassword });
  return success(res, 200, 'Password reset successfully', result);
});

module.exports = { register, login, verifyEmail, logout, changePassword, forgotPassword, resetPassword };