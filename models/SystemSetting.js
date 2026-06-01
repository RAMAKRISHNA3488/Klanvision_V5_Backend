import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    unique: true,
    field: 'setting_key'
  },
  value: {
    type: DataTypes.TEXT,
    field: 'setting_value'
  }
}, {
  tableName: 'settings',
  timestamps: false
});

export default SystemSetting;
export { SystemSetting };
