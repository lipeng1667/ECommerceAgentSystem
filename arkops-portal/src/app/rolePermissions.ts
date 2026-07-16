import type { Member } from '../types/domain';

export type Role = Member['role'];

/**
 * Operation-level permission actions.
 * Used for fine-grained access control within pages.
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';

/**
 * Resource identifiers for operation-level permission checks.
 */
export type PermissionResource =
  | 'orders'
  | 'products'
  | 'agents'
  | 'stores'
  | 'members'
  | 'models'
  | 'billing'
  | 'audit_logs'
  | 'notifications'
  | 'exceptions'
  | 'approvals'
  | 'setup';

/**
 * Centralized role permission matrix.
 * Defines which routes each role can access.
 * true = allowed, false = denied
 *
 * Based on PM-Audit product business mapping table v5.
 */
const ROLE_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  Owner: {
    '/dashboard': true, '/orders': true, '/products': true,
    '/agents': true, '/agents/exceptions': true, '/agents/approvals': true,
    '/stores': true, '/settings/stores': true, '/settings/members': true,
    '/settings/models': true, '/settings/billing': true,
    '/settings/audit-logs': true, '/settings/notifications': true,
    '/settings/guide': true, '/setup': true,
  },
  Admin: {
    '/dashboard': true, '/orders': true, '/products': true,
    '/agents': true, '/agents/exceptions': true, '/agents/approvals': true,
    '/stores': true, '/settings/stores': true, '/settings/members': true,
    '/settings/models': true, '/settings/billing': true,
    '/settings/audit-logs': true, '/settings/notifications': true,
    '/settings/guide': true, '/setup': true,
  },
  Operator: {
    '/dashboard': true, '/orders': true, '/products': true,
    '/agents': true, '/agents/exceptions': true, '/agents/approvals': true,
    '/stores': true, '/settings/stores': true, '/settings/members': false,
    '/settings/models': true, '/settings/billing': true,
    '/settings/audit-logs': true, '/settings/notifications': true,
    '/settings/guide': true, '/setup': true,
  },
  Approver: {
    '/dashboard': true, '/orders': true, '/products': true,
    '/agents': true, '/agents/exceptions': true, '/agents/approvals': true,
    '/stores': true, '/settings/stores': true, '/settings/members': false,
    '/settings/models': false, '/settings/billing': true,
    '/settings/audit-logs': false, '/settings/notifications': false,
    '/settings/guide': true, '/setup': false,
  },
  Finance: {
    '/dashboard': true, '/orders': false, '/products': false,
    '/agents': false, '/agents/exceptions': false, '/agents/approvals': false,
    '/stores': false, '/settings/stores': false, '/settings/members': false,
    '/settings/models': false, '/settings/billing': true,
    '/settings/audit-logs': false, '/settings/notifications': false,
    '/settings/guide': false, '/setup': false,
  },
  Viewer: {
    '/dashboard': true, '/orders': true, '/products': true,
    '/agents': true, '/agents/exceptions': true, '/agents/approvals': true,
    '/stores': true, '/settings/stores': true, '/settings/members': false,
    '/settings/models': true, '/settings/billing': true,
    '/settings/audit-logs': true, '/settings/notifications': false,
    '/settings/guide': true, '/setup': false,
  },
};

/**
 * Operation-level permission matrix.
 * Defines which CRUD actions each role can perform on each resource.
 *
 * Owner and Admin have full access (all actions on all resources).
 * Other roles have restricted access based on their responsibilities.
 */
const OPERATION_PERMISSIONS: Record<Role, Record<PermissionResource, PermissionAction[]>> = {
  Owner: {
    orders: ['create', 'read', 'update', 'delete', 'export'],
    products: ['create', 'read', 'update', 'delete', 'export'],
    agents: ['create', 'read', 'update', 'delete'],
    stores: ['create', 'read', 'update', 'delete'],
    members: ['create', 'read', 'update', 'delete'],
    models: ['create', 'read', 'update', 'delete'],
    billing: ['read', 'update', 'export'],
    audit_logs: ['read', 'export'],
    notifications: ['read', 'update'],
    exceptions: ['read', 'update'],
    approvals: ['read', 'approve'],
    setup: ['read', 'update'],
  },
  Admin: {
    orders: ['create', 'read', 'update', 'delete', 'export'],
    products: ['create', 'read', 'update', 'delete', 'export'],
    agents: ['create', 'read', 'update', 'delete'],
    stores: ['create', 'read', 'update', 'delete'],
    members: ['create', 'read', 'update', 'delete'],
    models: ['create', 'read', 'update', 'delete'],
    billing: ['read', 'update', 'export'],
    audit_logs: ['read', 'export'],
    notifications: ['read', 'update'],
    exceptions: ['read', 'update'],
    approvals: ['read', 'approve'],
    setup: ['read', 'update'],
  },
  Operator: {
    orders: ['create', 'read', 'update'],
    products: ['create', 'read', 'update'],
    agents: ['create', 'read', 'update'],
    stores: ['read', 'update'],
    members: [],
    models: ['read'],
    billing: ['read'],
    audit_logs: ['read'],
    notifications: ['read'],
    exceptions: ['read', 'update'],
    approvals: ['read'],
    setup: ['read'],
  },
  Approver: {
    orders: ['read'],
    products: ['read'],
    agents: ['read'],
    stores: ['read'],
    members: [],
    models: [],
    billing: ['read'],
    audit_logs: [],
    notifications: [],
    exceptions: ['read'],
    approvals: ['read', 'approve'],
    setup: [],
  },
  Finance: {
    orders: [],
    products: [],
    agents: [],
    stores: [],
    members: [],
    models: [],
    billing: ['read', 'update', 'export'],
    audit_logs: [],
    notifications: [],
    exceptions: [],
    approvals: [],
    setup: [],
  },
  Viewer: {
    orders: ['read'],
    products: ['read'],
    agents: ['read'],
    stores: ['read'],
    members: [],
    models: ['read'],
    billing: ['read'],
    audit_logs: ['read'],
    notifications: [],
    exceptions: ['read'],
    approvals: ['read'],
    setup: [],
  },
};

/** Menu items visible per role (for AppShell navigation filtering) */
const ROLE_MENU_VISIBILITY: Record<Role, Set<string>> = {
  Owner: new Set('*'),
  Admin: new Set('*'),
  Operator: new Set([
    '/dashboard', '/orders', '/products',
    '/agents', '/agents/exceptions', '/agents/approvals',
    '/stores', '/settings/stores', '/settings/models',
    '/settings/billing', '/settings/audit-logs', '/settings/notifications',
    '/settings/guide', '/setup',
  ]),
  Approver: new Set([
    '/dashboard', '/orders', '/products',
    '/agents', '/agents/exceptions', '/agents/approvals',
    '/stores', '/settings/stores', '/settings/billing',
    '/settings/guide',
  ]),
  Finance: new Set(['/dashboard', '/settings/billing']),
  Viewer: new Set([
    '/dashboard', '/orders', '/products',
    '/agents', '/agents/exceptions', '/agents/approvals',
    '/stores', '/settings/stores', '/settings/models',
    '/settings/billing', '/settings/audit-logs', '/settings/guide',
  ]),
};

/**
 * Check if a role can access a given path.
 * Agent detail pages (/agents/:agentType) inherit from /agents.
 */
export function canAccess(role: Role, pathname: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Exact match
  if (permissions[pathname] !== undefined) return permissions[pathname];

  // /agents/:agentType inherits from /agents
  if (pathname.startsWith('/agents/') && pathname !== '/agents/exceptions' && pathname !== '/agents/approvals') {
    return permissions['/agents'] ?? false;
  }

  // /stores/:storeId inherits from /stores
  if (pathname.startsWith('/stores/') && pathname !== '/stores/new') {
    return permissions['/stores'] ?? false;
  }

  // /agents/approvals/:id inherits from /agents/approvals
  if (pathname.startsWith('/agents/approvals/')) {
    return permissions['/agents/approvals'] ?? false;
  }

  // /settings/* sub-paths — check exact settings path
  if (pathname.startsWith('/settings/')) {
    return permissions[pathname] ?? false;
  }

  return false;
}

/**
 * Check if a role can perform a specific operation on a resource.
 *
 * @example
 * canOperate('Operator', 'orders', 'delete') // false
 * canOperate('Admin', 'stores', 'create')     // true
 */
export function canOperate(role: Role, resource: PermissionResource, action: PermissionAction): boolean {
  const resourcePermissions = OPERATION_PERMISSIONS[role];
  if (!resourcePermissions) return false;
  const allowed = resourcePermissions[resource];
  if (!allowed) return false;
  return allowed.includes(action);
}

/**
 * Get all allowed actions for a role on a given resource.
 * Returns empty array if the role has no access.
 */
export function getAllowedActions(role: Role, resource: PermissionResource): PermissionAction[] {
  const resourcePermissions = OPERATION_PERMISSIONS[role];
  if (!resourcePermissions) return [];
  return resourcePermissions[resource] ?? [];
}

/**
 * Check if a menu item should be visible for a role.
 */
export function isMenuVisible(role: Role, path: string): boolean {
  const visible = ROLE_MENU_VISIBILITY[role];
  if (!visible) return false;
  if (visible.has('*')) return true;
  return visible.has(path);
}

/**
 * Get accessible menu paths for a role (for navigation filtering).
 */
export function getAccessiblePaths(role: Role): string[] | null {
  const visible = ROLE_MENU_VISIBILITY[role];
  if (!visible) return [];
  if (visible.has('*')) return null; // null means all visible
  return Array.from(visible);
}
