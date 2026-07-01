'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailVerificationToken extends Model {
    static associate(models) {
      EmailVerificationToken.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }

    // derived helpers — cheap to read off the row, no stored redundancy
    get isExpired() {
      return this.expires_at < new Date();
    }
    get isUsed() {
      return this.used_at !== null;
    }
  }

  EmailVerificationToken.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'EmailVerificationToken',
      tableName: 'email_verification_tokens',
      underscored: true,
    }
  );

  return EmailVerificationToken;
};