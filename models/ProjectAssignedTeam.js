import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ProjectAssignedTeam = sequelize.define('ProjectAssignedTeam', {
  projectId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    field: 'project_id'
  },
  assignedTeam: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'assigned_team'
  }
}, {
  tableName: 'project_assigned_team',
  timestamps: false
});

export default ProjectAssignedTeam;
export { ProjectAssignedTeam };
