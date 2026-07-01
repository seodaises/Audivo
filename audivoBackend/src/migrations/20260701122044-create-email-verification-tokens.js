'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_verification_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // delete a user -> their pending tokens go too
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true, // the lookup key; must be unique
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false, // every token has a hard TTL
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true, // NULL = not yet consumed
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_verification_tokens');
  },
};
