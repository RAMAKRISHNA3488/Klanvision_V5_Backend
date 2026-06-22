import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InternshipCandidate = sequelize.define('InternshipCandidate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'candidate_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
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
  address: {
    type: DataTypes.TEXT
  },
  collegeName: {
    type: DataTypes.STRING,
    field: 'college_name'
  },
  university: {
    type: DataTypes.STRING
  },
  degree: {
    type: DataTypes.STRING
  },
  branch: {
    type: DataTypes.STRING
  },
  graduationYear: {
    type: DataTypes.STRING,
    field: 'graduation_year'
  },
  cgpa: {
    type: DataTypes.STRING
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'end_date'
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mentorName: {
    type: DataTypes.STRING,
    field: 'mentor_name'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  certificateNumber: {
    type: DataTypes.STRING,
    unique: true,
    field: 'certificate_number'
  },
  certificateDate: {
    type: DataTypes.STRING,
    field: 'certificate_date'
  },
  performanceRemarks: {
    type: DataTypes.TEXT,
    field: 'performance_remarks'
  },
  recommendationText: {
    type: DataTypes.TEXT,
    field: 'recommendation_text'
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'is_deleted'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'internship_candidates',
  timestamps: false
});

export default InternshipCandidate;
export { InternshipCandidate };
