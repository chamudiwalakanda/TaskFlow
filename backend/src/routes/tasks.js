const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { isMember, requireMember } = require('../middleware/access');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const TASK_SELECT = `
  SELECT t.*, a.name AS assignee_name, c.name AS creator_name, p.name AS project_name
    FROM tasks t
    LEFT JOIN users a ON a.id = t.assigned_to
    JOIN users c ON c.id = t.created_by
    JOIN projects p ON p.id = t.project_id`;

// ---------- Routes nested under a project: /api/projects/:projectId/tasks ----------
const projectTasks = express.Router({ mergeParams: true });
projectTasks.use(auth, requireMember);

// GET  ?status=todo&priority=high&assigned_to=3&q=search
projectTasks.get('/', async (req, res, next) => {
  try {
    const where = ['t.project_id = ?'];
    const params = [req.params.projectId];
    const { status, priority, assigned_to, q } = req.query;
    if (status)      { where.push('t.status = ?');      params.push(status); }
    if (priority)    { where.push('t.priority = ?');    params.push(priority); }
    if (assigned_to) { where.push('t.assigned_to = ?'); params.push(assigned_to); }
    if (q)           { where.push('t.title LIKE ?');    params.push(`%${q}%`); }

    const [rows] = await db.query(
      `${TASK_SELECT} WHERE ${where.join(' AND ')}
       ORDER BY FIELD(t.priority,'high','medium','low'), t.due_date IS NULL, t.due_date, t.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST create a task
projectTasks.post('/', async (req, res, next) => {
  try {
    const { title, description, status = 'todo', priority = 'medium', assigned_to = null, due_date = null } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Task title is required' });
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (!PRIORITIES.includes(priority)) return res.status(400).json({ message: 'Invalid priority' });
    if (assigned_to && !(await isMember(req.params.projectId, assigned_to))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, created_by, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.projectId, title.trim(), description || null, status, priority, assigned_to || null, req.user.id, due_date || null]
    );
    const [rows] = await db.query(`${TASK_SELECT} WHERE t.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- Routes on a single task: /api/tasks ----------
const tasks = express.Router();
tasks.use(auth);

// GET /api/tasks/mine  -> tasks assigned to me across all projects
tasks.get('/mine', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${TASK_SELECT} WHERE t.assigned_to = ? AND t.status <> 'done'
       ORDER BY t.due_date IS NULL, t.due_date`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Helper: load a task and make sure the caller belongs to its project
async function loadTask(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    if (!(await isMember(rows[0].project_id, req.user.id))) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    req.task = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id  (send only the fields you want to change)
tasks.put('/:id', loadTask, async (req, res, next) => {
  try {
    const t = req.task;
    const b = req.body;
    const next_ = {
      title: b.title !== undefined ? String(b.title).trim() : t.title,
      description: b.description !== undefined ? b.description : t.description,
      status: b.status !== undefined ? b.status : t.status,
      priority: b.priority !== undefined ? b.priority : t.priority,
      assigned_to: b.assigned_to !== undefined ? b.assigned_to || null : t.assigned_to,
      due_date: b.due_date !== undefined ? b.due_date || null : t.due_date,
    };
    if (!next_.title) return res.status(400).json({ message: 'Task title is required' });
    if (!STATUSES.includes(next_.status)) return res.status(400).json({ message: 'Invalid status' });
    if (!PRIORITIES.includes(next_.priority)) return res.status(400).json({ message: 'Invalid priority' });
    if (next_.assigned_to && !(await isMember(t.project_id, next_.assigned_to))) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    await db.query(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, assigned_to=?, due_date=? WHERE id=?`,
      [next_.title, next_.description, next_.status, next_.priority, next_.assigned_to, next_.due_date, t.id]
    );
    const [rows] = await db.query(`${TASK_SELECT} WHERE t.id = ?`, [t.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
tasks.delete('/:id', loadTask, async (req, res, next) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [req.task.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = { projectTasks, tasks };
