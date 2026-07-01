'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Look up real ids by name — never hardcode them.
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, `key` FROM permissions;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleId = {};
    roles.forEach((r) => { roleId[r.name] = r.id; });
    const permId = {};
    permissions.forEach((p) => { permId[p.key] = p.id; });

    const allPerms = [
      'upload_songs', 'delete_songs', 'manage_users',
      'view_analytics', 'feature_songs', 'moderate_comments',
    ];
    const grants = {
      'Super Admin': allPerms,
      'Admin': allPerms,
      'Moderator': ['moderate_comments'],
    };

    const now = new Date();
    const rows = [];
    Object.entries(grants).forEach(([roleName, permKeys]) => {
      permKeys.forEach((key) => {
        rows.push({
          role_id: roleId[roleName],
          permission_id: permId[key],
          createdAt: now,
          updatedAt: now,
        });
      });
    });

    await queryInterface.bulkInsert('role_permissions', rows);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  },
};