const db = require('../config/db');

// Is this user a member of this project?
async function isMember(projectId, userId) {
  const [rows] = await db.query(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length > 0;
}

// Middleware: only project members may continue.
async function requireMember(req, res, next) {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!(await isMember(projectId, req.user.id))) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { isMember, requireMember };
