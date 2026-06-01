import { JobListing } from '../models/JobListing.js';

export const getActiveJobs = async (req, res) => {
  try {
    const jobs = await JobListing.findAll({
      where: { active: true }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobListing.findAll();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, active } = req.body;
    const newJob = await JobListing.create({
      title,
      department,
      location,
      type,
      description,
      requirements,
      active: active ?? true
    });
    res.json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, type, description, requirements, active } = req.body;
    const job = await JobListing.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }
    await job.update({
      title,
      department,
      location,
      type,
      description,
      requirements,
      active
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await JobListing.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found' });
    }
    await job.destroy();
    res.json({ message: 'Job listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
