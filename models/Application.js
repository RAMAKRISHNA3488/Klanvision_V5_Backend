import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  jobTitle: {
    type: DataTypes.STRING,
    field: 'job_title'
  },
  name: {
    type: DataTypes.STRING
  },
  dob: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  gender: {
    type: DataTypes.STRING
  },
  qualification: {
    type: DataTypes.STRING
  },
  experience: {
    type: DataTypes.STRING
  },
  skills: {
    type: DataTypes.TEXT
  },
  linkedin: {
    type: DataTypes.STRING
  },
  portfolio: {
    type: DataTypes.STRING
  },
  resumeData: {
    type: DataTypes.BLOB('long'),
    field: 'resume_data'
  },
  resumeFileName: {
    type: DataTypes.STRING,
    field: 'resume_file_name'
  },
  resumeContentType: {
    type: DataTypes.STRING,
    field: 'resume_content_type'
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'job_applications',
  timestamps: false
});

export default Application;
export { Application };
