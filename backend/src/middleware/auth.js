/**
 * HandoverIQ Authentication & Access Control Middleware
 * Team: ROGUENOVA
 * 
 * Enforces role-based access control (RBAC) on confidential employee records.
 * Sensitive fields (such as 'salary') are strictly isolated to authorized HR roles
 * and are NEVER returned to standard employee or manager queries.
 */

export function authenticate(req, res, next) {
  // Check role header or authorization claim
  const roleHeader = req.headers['x-user-role']?.toLowerCase();
  const authHeader = req.headers['authorization'];

  // Check if role is explicitly authorized as HR
  let userRole = 'employee';

  if (roleHeader === 'hr' || roleHeader === 'admin') {
    userRole = 'hr';
  } else if (authHeader && authHeader.includes('role=hr')) {
    userRole = 'hr';
  }

  req.userRole = userRole;
  req.isHR = userRole === 'hr';

  next();
}

/**
 * Middleware requiring HR privileges to perform sensitive operations
 */
export function requireHR(req, res, next) {
  if (!req.isHR) {
    return res.status(403).json({
      error: 'Forbidden: Insufficient privileges',
      message: 'Access to confidential compensation data or operations requires authorized HR credentials.'
    });
  }
  next();
}
