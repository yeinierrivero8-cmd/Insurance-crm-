/**
 * RBAC Middleware — Permission Validation Middleware
 *
 * Provides requirePermission and requireRole middleware for route protection.
 * Validates user permissions before allowing access to protected endpoints.
 */

const RBACService = require('../services/RBACService.cjs');

/**
 * Middleware: Require specific permission
 *
 * Usage:
 *   router.post('/clients', requirePermission('clients:create'), handler)
 *
 * @param {string} permission - Permission string (e.g., 'clients:create')
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No role found in token'
        });
      }

      const hasPermission = RBACService.hasPermission(userRole, permission);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `User role "${userRole}" lacks permission "${permission}"`,
          requiredPermission: permission,
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('RBAC requirePermission middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware: Require specific role(s)
 *
 * Usage:
 *   router.post('/audit', requireRole(['admin']), handler)
 *   router.get('/settings', requireRole(['admin', 'agent']), handler)
 *
 * @param {string | string[]} allowedRoles - Role or array of roles
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No role found in token'
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Only ${roles.join(', ')} can access this resource`,
          requiredRoles: roles,
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('RBAC requireRole middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Role check failed'
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole
};
