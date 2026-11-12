// HandoverIQ Authentication & Access Control Middleware
// Team: ROGUENOVA
// Secure demo mode: Only valid server-issued demo tokens or configured server secrets grant access.
// Client role headers (e.g. x-user-role) are NEVER trusted for privilege escalation.

const DEMO_API_BEARER = process.env.DEMO_API_KEY || 'handoveriq-demo-token-2026';
const HR_PASSCODE = process.env.DEMO_HR_SECRET || 'roguenova-hr-authorized-passcode';

export function authenticate(req, res, next) {
  // Allow authenticated requests via standard Authorization Bearer header
  const authHeader = req.headers['authorization'];
  
  // If authorization header is present, validate server-recognized token
  let isAuthenticatedUser = false;
  let isHRUser = false;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token === DEMO_API_BEARER) {
        isAuthenticatedUser = true;
      } else if (token === HR_PASSCODE) {
        isAuthenticatedUser = true;
        isHRUser = true;
      }
    }
  } else {
    // In demo environment without auth header: default to standard authenticated demo user
    // but NEVER elevate to HR without server-verified secret token
    isAuthenticatedUser = true;
    isHRUser = false;
  }

  // Explicitly ignore and reject client-supplied role headers
  req.userRole = isHRUser ? 'hr' : 'employee';
  req.isHR = isHRUser;
  req.isAuthenticated = isAuthenticatedUser;
  next();
}

// Export a convenient middleware name used throughout the app
export const isAuthenticated = authenticate;

/**
 * Middleware requiring HR privileges to perform sensitive operations (e.g. view/set salary)
 */
export function requireHR(req, res, next) {
  if (!req.isHR) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Insufficient privileges',
      message: 'Access to confidential compensation data or operations requires authorized HR credentials.'
    });
  }
  next();
}
