import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ProjectAssignedTeam } from './ProjectAssignedTeam.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING
  },
  client: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING
  },
  progress: {
    type: DataTypes.INTEGER
  },
  startDate: {
    type: DataTypes.STRING,
    field: 'start_date'
  },
  deadline: {
    type: DataTypes.STRING
  },
  color: {
    type: DataTypes.STRING
  },
  priority: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  comments: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'projects',
  timestamps: false
});

// Setup relationships
Project.hasMany(ProjectAssignedTeam, { foreignKey: 'project_id', as: 'teamAssociations', onDelete: 'CASCADE' });
ProjectAssignedTeam.belongsTo(Project, { foreignKey: 'project_id' });

export default Project;
export { Project };
