const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { requireMember } = require('../middleware/access');

const router = express.Router();
router.use(auth); // every route below needs login

// GET /api/projects  -> projects I belong to
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS owner_name,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
         FROM projects p
         JOIN project_members m ON m.project_id = p.id
         JOIN users u ON u.id = p.owner_id
        WHERE m.user_id = ?
        ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Project name is required' });

    const [result] = await db.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name.trim(), description || null, req.user.id]
    );
    // the creator automatically becomes a member
    await db.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [
      result.insertId,
      req.user.id,
    ]);
    res.status(201).json({ id: result.insertId, name: name.trim(), description: description || null });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', requireMember, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id   (owner only)
router.put('/:id', requireMember, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Project name is required' });
    const [result] = await db.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ? AND owner_id = ?',
      [name.trim(), description || null, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(403).json({ message: 'Only the owner can edit this project' });
    res.json({ message: 'Project updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id   (owner only)
router.delete('/:id', requireMember, async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM projects WHERE id = ? AND owner_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (!result.affectedRows) return res.status(403).json({ message: 'Only the owner can delete this project' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// ---------- Members ----------

// GET /api/projects/:id/members
router.get('/:id/members', requireMember, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email
         FROM project_members m JOIN users u ON u.id = m.user_id
        WHERE m.project_id = ? ORDER BY u.name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/members   body: { email }   (owner only)
router.post('/:id/members', requireMember, async (req, res, next) => {
  try {
    const [proj] = await db.query('SELECT owner_id FROM projects WHERE id = ?', [req.params.id]);
    if (!proj.length || proj[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can add members' });
    }
    const email = (req.body.email || '').trim().toLowerCase();
    const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'No user with that email. Ask them to register first.' });

    await db.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [
      req.params.id,
      users[0].id,
    ]);
    res.status(201).json(users[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/members/:userId   (owner only)
router.delete('/:id/members/:userId', requireMember, async (req, res, next) => {
  try {
    const [proj] = await db.query('SELECT owner_id FROM projects WHERE id = ?', [req.params.id]);
    if (!proj.length || proj[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }
    if (Number(req.params.userId) === req.user.id) {
      return res.status(400).json({ message: 'The owner cannot be removed' });
    }
    await db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [
      req.params.id,
      req.params.userId,
    ]);
    // un-assign their tasks in this project
    await db.query('UPDATE tasks SET assigned_to = NULL WHERE project_id = ? AND assigned_to = ?', [
      req.params.id,
      req.params.userId,
    ]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
