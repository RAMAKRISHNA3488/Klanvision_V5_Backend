import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { AdminUserPermission } from './AdminUserPermission.js';

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'ADMIN'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Offline'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366F1'
  },
  lastActive: {
    type: DataTypes.STRING,
    field: 'last_active',
    defaultValue: 'Never'
  },
  isAuthorized: {
    type: DataTypes.BOOLEAN,
    field: 'is_authorized',
    defaultValue: true
  },
  is2FAEnabled: {
    type: DataTypes.BOOLEAN,
    field: 'is2faenabled',
    defaultValue: true
  },
  is2FAConfigured: {
    type: DataTypes.BOOLEAN,
    field: 'is2faconfigured',
    defaultValue: false
  },
  secret2FA: {
    type: DataTypes.STRING,
    field: 'secret2fa'
  },
  failed2FAAttempts: {
    type: DataTypes.INTEGER,
    field: 'failed2faattempts',
    defaultValue: 0
  }
}, {
  tableName: 'admins',
  timestamps: false
});

// Setup relationship to auxiliary permissions join table
AdminUser.hasMany(AdminUserPermission, { foreignKey: 'admin_user_id', as: 'permissionAssociations', onDelete: 'CASCADE' });
AdminUserPermission.belongsTo(AdminUser, { foreignKey: 'admin_user_id' });

export default AdminUser;
export { AdminUser };
