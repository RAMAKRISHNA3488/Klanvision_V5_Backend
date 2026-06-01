import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  dob: {
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
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'candidates',
  timestamps: false
});

export default Candidate;
export { Candidate };
