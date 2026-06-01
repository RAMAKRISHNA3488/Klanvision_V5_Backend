import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AuditActivity = sequelize.define('AuditActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user: {
    type: DataTypes.STRING
  },
  action: {
    type: DataTypes.STRING
  },
  type: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING
  },
  details: {
    type: DataTypes.TEXT
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'activities',
  timestamps: false
});

export default AuditActivity;
export { AuditActivity };
