const auditLog = require('./auditLogger');

const allowedRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      auditLog(req, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user.id,
        requiredRole: roles,
        userRole: req.user.role,
        endpoint: req.path
      });
      return res.status(403).json({ error: 'Acceso denegado. Rol insuficiente.' });
    }

    next();
  };
};

module.exports = allowedRoles;
