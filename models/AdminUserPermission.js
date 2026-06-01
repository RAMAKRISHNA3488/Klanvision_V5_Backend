import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AdminUserPermission = sequelize.define('AdminUserPermission', {
  adminUserId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    field: 'admin_user_id'
  },
  permission: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'permissions'
  }
}, {
  tableName: 'admin_user_permissions',
  timestamps: false
});

export default AdminUserPermission;
export { AdminUserPermission };
