const LoginAttemptService = require('../services/LoginAttemptService');

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const { email, agencyId } = req.body;

    if (!email || !agencyId) {
      return next(); // Continue if no email/agencyId
    }

    // Check if account is locked
    const lockStatus = await LoginAttemptService.isAccountLocked(email, agencyId);

    if (lockStatus.locked) {
      return res.status(429).json({
        error: 'too_many_attempts',
        message: `Account temporarily locked. Try again in ${lockStatus.minutesRemaining} minute(s).`,
        retryAfter: lockStatus.minutesRemaining * 60,
        lockedUntil: lockStatus.lockedUntil
      });
    }

    // Store in request for later use
    req.loginContext = { email, agencyId };
    next();
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    next(); // Fail open - don't block user
  }
};

module.exports = rateLimitMiddleware;
