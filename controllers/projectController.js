import { Project } from '../models/Project.js';
import { ProjectAssignedTeam } from '../models/ProjectAssignedTeam.js';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: ProjectAssignedTeam, as: 'teamAssociations' }]
    });

    const mapped = projects.map(project => {
      const projectJSON = project.toJSON();
      projectJSON.assignedTeam = projectJSON.teamAssociations.map(t => t.assignedTeam);
      delete projectJSON.teamAssociations;
      return projectJSON;
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = req.body;
    const newProject = await Project.create({
      title,
      client,
      status,
      progress,
      startDate,
      deadline,
      color: color || ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#7C3AED'][Math.floor(Math.random() * 5)],
      priority,
      description,
      comments
    });

    if (assignedTeam && Array.isArray(assignedTeam)) {
      for (const member of assignedTeam) {
        await ProjectAssignedTeam.create({ projectId: newProject.id, assignedTeam: member });
      }
    }

    const responseData = newProject.toJSON();
    responseData.assignedTeam = assignedTeam || [];
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = req.body;
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update({
      title,
      client,
      status,
      progress,
      startDate,
      deadline,
      color,
      priority,
      description,
      comments
    });

    if (assignedTeam && Array.isArray(assignedTeam)) {
      await ProjectAssignedTeam.destroy({ where: { projectId: id } });
      for (const member of assignedTeam) {
        await ProjectAssignedTeam.create({ projectId: id, assignedTeam: member });
      }
    }

    const responseData = project.toJSON();
    responseData.assignedTeam = assignedTeam || [];
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
