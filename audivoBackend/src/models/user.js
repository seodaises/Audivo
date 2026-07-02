'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // one role per user
      User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
      User.hasMany(models.EmailVerificationToken, {
  foreignKey: 'user_id',
  as: 'verificationTokens',
});
User.hasMany(models.PasswordResetToken, { foreignKey: 'user_id', as: 'resetTokens' });
User.hasMany(models.LoginHistory, { foreignKey: 'user_id', as: 'loginHistory' });
    }

    // derived, not stored — keeps "when" as the single source of truth
    get isVerified() {
      return this.email_verified_at !== null;
    }
  }

  User.init(
    {
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true, // maps createdAt -> created_at automatically
    }
  );

  return User;
};