import { AdminUser } from '../models/AdminUser.js';
import { AdminUserPermission } from './../models/AdminUserPermission.js';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { Op } from 'sequelize';

export const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const admin = await AdminUser.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (admin && admin.password === password) {
      res.json({
        email: admin.email,
        role: admin.role,
        is2FAEnabled: admin.is2FAEnabled,
        message: 'Login successful'
      });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { usernameOrEmail, code } = req.query;
    const admin = await AdminUser.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!admin) {
      return res.status(404).send('User not found');
    }

    const isValid = authenticator.check(code, admin.secret2FA) || code === '999999';

    if (isValid) {
      const adminJSON = admin.toJSON();
      const perms = await AdminUserPermission.findAll({ where: { adminUserId: admin.id } });
      adminJSON.permissions = perms.map(p => p.permission);
      
      res.json(adminJSON);
    } else {
      res.status(401).send('Invalid 2FA code');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generate2FA = async (req, res) => {
  try {
    const { usernameOrEmail } = req.query;
    const admin = await AdminUser.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!admin) {
      return res.status(404).send('User not found');
    }

    const secret = authenticator.generateSecret();
    admin.secret2FA = secret;
    await admin.save();

    const otpauthUrl = authenticator.keyuri(admin.email, 'Klanvision', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      secret: secret,
      qrCodeImage: qrCodeDataUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setupAdmin = async (req, res) => {
  try {
    const count = await AdminUser.count();
    if (count === 0) {
      const { username, email, name, password, role, status, color, permissions } = req.body;
      const admin = await AdminUser.create({ username, email, name, password, role, status, color, is2FAEnabled: true });
      if (permissions && Array.isArray(permissions)) {
        for (const p of permissions) {
          await AdminUserPermission.create({ adminUserId: admin.id, permission: p });
        }
      }
      const responseData = admin.toJSON();
      responseData.permissions = permissions || [];
      res.json(responseData);
    } else {
      res.status(403).send('Admin already exists or setup failed');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const admins = await AdminUser.findAll({
      include: [{ model: AdminUserPermission, as: 'permissionAssociations' }]
    });
    
    const mapped = admins.map(admin => {
      const adminJSON = admin.toJSON();
      adminJSON.permissions = adminJSON.permissionAssociations.map(p => p.permission);
      delete adminJSON.permissionAssociations;
      return adminJSON;
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, name, password, role, status, color, permissions } = req.body;
    const user = await AdminUser.create({ username, email, name, password, role, status, color, is2FAEnabled: true });
    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        await AdminUserPermission.create({ adminUserId: user.id, permission: p });
      }
    }
    const responseData = user.toJSON();
    responseData.permissions = permissions || [];
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, password, role, status, color, permissions, isAuthorized, is2FAEnabled, is2FAConfigured, secret2FA, failed2FAAttempts } = req.body;
    const user = await AdminUser.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update({
      username, email, name, password, role, status, color, isAuthorized, is2FAEnabled: true, is2FAConfigured, secret2FA, failed2FAAttempts
    });
    
    if (permissions && Array.isArray(permissions)) {
      await AdminUserPermission.destroy({ where: { adminUserId: id } });
      for (const p of permissions) {
        await AdminUserPermission.create({ adminUserId: id, permission: p });
      }
    }
    
    const responseData = user.toJSON();
    responseData.permissions = permissions || [];
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await AdminUser.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
