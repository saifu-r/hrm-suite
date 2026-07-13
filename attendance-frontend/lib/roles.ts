export type Role = 'super_admin' | 'company_admin' | 'hr' | 'manager' | 'employee';

// Which roles can access each page
export const pageRoles: Record<string, Role[]> = {
  '/':           ['super_admin', 'company_admin', 'hr', 'manager'],
  '/employees':  ['super_admin', 'company_admin', 'hr', 'manager'],
  '/attendance': ['super_admin', 'company_admin', 'hr', 'manager'],
  '/reports':    ['super_admin', 'company_admin', 'hr', 'manager'],
  '/timetable':  ['super_admin', 'company_admin', 'hr'],
  '/shifts':     ['super_admin', 'company_admin', 'hr'],
  '/devices':    ['super_admin', 'company_admin'],
  '/settings':   ['super_admin', 'company_admin'],
  '/users':      ['super_admin', 'company_admin'],  // ← add this
};

// Which roles can perform write actions
export const writeRoles: Record<string, Role[]> = {
  employees:   ['super_admin', 'company_admin', 'hr'],
  shifts:      ['super_admin', 'company_admin', 'hr'],
  timetables:  ['super_admin', 'company_admin', 'hr'],
  devices:     ['super_admin', 'company_admin'],
};

export function canAccess(role: Role, page: string): boolean {
  return pageRoles[page]?.includes(role) ?? false;
}

export function canWrite(role: Role, resource: string): boolean {
  return writeRoles[resource]?.includes(role) ?? false;
}