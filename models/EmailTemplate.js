import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateKey: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'template_key'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'email_templates',
  timestamps: false
});

export default EmailTemplate;
export { EmailTemplate };
