import { Candidate } from '../models/Candidate.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, qualification, experience, skills, linkedin, portfolio } = req.body;
    
    const existing = await Candidate.findOne({ where: { email } });
    if (existing) {
      return res.status(400).send('Email already registered');
    }
    
    let resumeData = null;
    let resumeFileName = null;
    let resumeContentType = null;
    
    if (req.file) {
      resumeData = req.file.buffer;
      resumeFileName = req.file.originalname;
      resumeContentType = req.file.mimetype;
    }
    
    const candidate = await Candidate.create({
      name,
      email,
      password, // Retains simple raw password comparison matches to mirror the exact Spring Boot seeder logic
      phone,
      dob,
      gender,
      qualification,
      experience,
      skills,
      linkedin,
      portfolio,
      resumeData,
      resumeFileName,
      resumeContentType,
      createdAt: new Date()
    });
    
    // Remove binary data before returning created candidate JSON
    const responseData = candidate.toJSON();
    delete responseData.resumeData;
    
    res.status(201).json(responseData); // Mapped to Spring's HttpStatus.CREATED status code 201
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const candidate = await Candidate.findOne({ where: { email } });
    
    if (candidate && candidate.password === password) {
      const responseData = candidate.toJSON();
      delete responseData.resumeData;
      
      res.json({
        token: `mock-candidate-token-${candidate.id}`,
        candidate: responseData
      });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByPk(id, {
      attributes: { exclude: ['resumeData'] }
    });
    if (candidate) {
      res.json(candidate);
    } else {
      res.status(404).send('Candidate not found');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByPk(id);
    if (!candidate || !candidate.resumeData) {
      return res.status(404).send('Resume not found');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.resumeFileName}"`);
    res.setHeader('Content-Type', candidate.resumeContentType);
    res.send(candidate.resumeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
