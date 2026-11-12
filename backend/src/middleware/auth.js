// HandoverIQ Authentication & Access Control Middleware
// Team: ROGUENOVA
// Enforces RBAC for confidential fields (e.g., salary). HR role required for sensitive data.

export function authenticate(req, res, next) {
  const roleHeader = req.headers['x-user-role']?.toLowerCase();
  const authHeader = req.headers['authorization'];

  let userRole = 'employee'; // default
  if (roleHeader === 'hr' || roleHeader === 'admin') {
    userRole = 'hr';
  } else if (authHeader && authHeader.includes('role=hr')) {
    userRole = 'hr';
  }

  req.userRole = userRole;
  req.isHR = userRole === 'hr';
  next();
}

// Export a convenient middleware name used throughout the app
export const isAuthenticated = authenticate;

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
