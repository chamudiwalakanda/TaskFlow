const jwt = require('jsonwebtoken');

// Protects routes: request must carry  Authorization: Bearer <token>
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in' });

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
    const payload = jwt.verify(token, secret);
    
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
