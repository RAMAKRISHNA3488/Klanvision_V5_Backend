import { AuditActivity } from '../models/AuditActivity.js';
import { Op } from 'sequelize';

/**
 * GET /api/activities
 * Optional query param: ?afterId=NUMBER  → returns only activities with id > afterId (for live polling)
 * Optional query param: ?limit=N         → max rows returned (default 100)
 *
 * NOTE: We order by `id DESC` (not timestamp) because some legacy rows have
 * incorrect timestamps due to a timezone mismatch when they were first inserted.
 * The auto-increment `id` is always monotonically correct.
 */
export const getAllActivities = async (req, res) => {
  try {
    const { afterId, limit } = req.query;
    const where = {};

    if (afterId) {
      const parsedId = parseInt(afterId, 10);
      if (!isNaN(parsedId)) {
        where.id = { [Op.gt]: parsedId };
      }
    }

    const activities = await AuditActivity.findAll({
      where,
      order: [['id', 'DESC']],
      limit: limit ? Math.min(parseInt(limit, 10), 500) : 100
    });

    res.json(activities);
  } catch (error) {
    console.error('[Activities] GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/activities
 * Body: { user, action, type, status, details }
 */
export const addActivity = async (req, res) => {
  try {
    const { user, action, type, status, details } = req.body;

    if (!user || !action) {
      return res.status(400).json({ error: 'user and action are required' });
    }

    const newActivity = await AuditActivity.create({
      user: String(user).substring(0, 100),
      action: String(action).substring(0, 100),
      type: String(type || 'system').substring(0, 50),
      status: String(status || 'info').substring(0, 20),
      details: details ? String(details).substring(0, 500) : null,
      timestamp: new Date()
    });

    res.status(201).json(newActivity);
  } catch (error) {
    console.error('[Activities] POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/activities/purge
 * Deletes all activities older than 30 days.
 * Called by the server's daily scheduled job.
 */
export const purgeOldActivities = async () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const deleted = await AuditActivity.destroy({
      where: {
        timestamp: { [Op.lt]: cutoff }
      }
    });
    if (deleted > 0) {
      console.log(`[Activity Purge] Deleted ${deleted} activity records older than 30 days.`);
    }
  } catch (error) {
    console.error('[Activity Purge] Failed:', error.message);
  }
};
