import { Application } from '../models/Application.js';

export const submitApplication = async (req, res) => {
  try {
    const { jobTitle, name, dob, email, phone, gender, qualification, experience, skills, linkedin, portfolio } = req.body;
    
    let resumeData = null;
    let resumeFileName = null;
    let resumeContentType = null;
    
    if (req.file) {
      resumeData = req.file.buffer;
      resumeFileName = req.file.originalname;
      resumeContentType = req.file.mimetype;
    }
    
    await Application.create({
      jobTitle,
      name,
      dob,
      email,
      phone,
      gender,
      qualification,
      experience,
      skills,
      linkedin,
      portfolio,
      resumeData,
      resumeFileName,
      resumeContentType,
      submittedAt: new Date()
    });
    
    res.send('Application submitted successfully');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const apps = await Application.findAll({
      attributes: { exclude: ['resumeData'] } // Don't fetch binary blobs in bulk list, optimizes memory load
    });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findByPk(id);
    if (!app || !app.resumeData) {
      return res.status(404).send('Resume not found');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${app.resumeFileName}"`);
    res.setHeader('Content-Type', app.resumeContentType);
    res.send(app.resumeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findByPk(id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }
    await app.destroy();
    res.send('Application deleted');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
