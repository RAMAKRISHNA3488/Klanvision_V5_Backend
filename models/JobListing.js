import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const JobListing = sequelize.define('JobListing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING
  },
  department: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  type: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  requirements: {
    type: DataTypes.TEXT
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'job_listings',
  timestamps: false
});

export default JobListing;
export { JobListing };
