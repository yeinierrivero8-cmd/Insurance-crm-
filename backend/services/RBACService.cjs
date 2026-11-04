/**
 * RBAC Service — Role-Based Access Control
 *
 * Manages permissions matrix for admin/agent/viewer roles.
 * Centralizes authorization logic for the entire application.
 */

const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  // Clients
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_READ: 'clients:read',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',

  // Policies
  POLICIES_CREATE: 'policies:create',
  POLICIES_READ: 'policies:read',
  POLICIES_UPDATE: 'policies:update',
  POLICIES_DELETE: 'policies:delete',

  // Renewals
  RENEWALS_READ: 'renewals:read',
  RENEWALS_UPDATE: 'renewals:update',

  // Audit logs
  AUDIT_READ: 'audit:read',

  // Settings (admin only)
  SETTINGS_UPDATE: 'settings:update'
};

/**
 * Role → Permissions mapping
 *
 * ADMIN: Full access to all operations
 * AGENT: Create, read, update (no delete); can read audit
 * VIEWER: Read-only access
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.POLICIES_CREATE,
    PERMISSIONS.POLICIES_READ,
    PERMISSIONS.POLICIES_UPDATE,
    PERMISSIONS.POLICIES_DELETE,
    PERMISSIONS.RENEWALS_READ,
    PERMISSIONS.RENEWALS_UPDATE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SETTINGS_UPDATE
  ],

  [ROLES.AGENT]: [
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.POLICIES_CREATE,
    PERMISSIONS.POLICIES_READ,
    PERMISSIONS.POLICIES_UPDATE,
    PERMISSIONS.RENEWALS_READ,
    PERMISSIONS.RENEWALS_UPDATE,
    PERMISSIONS.AUDIT_READ
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.POLICIES_READ,
    PERMISSIONS.RENEWALS_READ,
    PERMISSIONS.AUDIT_READ
  ]
};

class RBACService {
  /**
   * Check if a user role has a specific permission
   * @param {string} userRole - User role (admin/agent/viewer)
   * @param {string} permission - Permission to check (e.g., 'clients:create')
   * @returns {boolean} true if user has permission
   */
  hasPermission(userRole, permission) {
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    return rolePerms.includes(permission);
  }

  /**
   * Get role constant value
   * @param {string} roleString - Role string
   * @returns {string} Role value (pass-through for validation)
   */
  getRole(roleString) {
    return roleString;
  }

  /**
   * Check if user can create clients
   */
  canCreateClient(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.CLIENTS_CREATE);
  }

  /**
   * Check if user can read clients
   */
  canReadClient(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.CLIENTS_READ);
  }

  /**
   * Check if user can update clients
   */
  canUpdateClient(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.CLIENTS_UPDATE);
  }

  /**
   * Check if user can delete clients
   */
  canDeleteClient(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.CLIENTS_DELETE);
  }

  /**
   * Check if user can create policies
   */
  canCreatePolicy(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.POLICIES_CREATE);
  }

  /**
   * Check if user can read policies
   */
  canReadPolicy(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.POLICIES_READ);
  }

  /**
   * Check if user can update policies
   */
  canUpdatePolicy(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.POLICIES_UPDATE);
  }

  /**
   * Check if user can delete policies
   */
  canDeletePolicy(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.POLICIES_DELETE);
  }

  /**
   * Check if user can read renewals
   */
  canReadRenewal(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.RENEWALS_READ);
  }

  /**
   * Check if user can update renewals
   */
  canUpdateRenewal(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.RENEWALS_UPDATE);
  }

  /**
   * Check if user can read audit logs
   */
  canReadAudit(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.AUDIT_READ);
  }

  /**
   * Check if user can update settings
   */
  canUpdateSettings(userRole) {
    return this.hasPermission(userRole, PERMISSIONS.SETTINGS_UPDATE);
  }

  /**
   * Get all permissions for a role
   * @param {string} userRole - User role
   * @returns {string[]} Array of permissions
   */
  getPermissionsForRole(userRole) {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Validate role is valid
   * @param {string} role - Role to validate
   * @returns {boolean} true if role is valid
   */
  isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }
}

module.exports = new RBACService();
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;
