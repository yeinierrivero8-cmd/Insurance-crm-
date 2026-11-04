const crypto = require('crypto');

class LoginAttemptService {
  constructor() {
    this.store = new Map();  // For test-server.cjs
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async recordFailedAttempt(email, agencyId, reason = 'invalid_credentials') {
    const key = `${agencyId}:${email}`;
    const now = Date.now();
    const ATTEMPT_WINDOW = 15 * 60 * 1000;  // 15 minutes
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 5;

    let record = this.store.get(key);

    if (!record) {
      record = {
        attempts: 0,
        lastAttempt: 0,
        lockedUntil: null,
        agencyId,
        email
      };
      this.store.set(key, record);
    }

    // Check if lock has expired
    if (record.lockedUntil && record.lockedUntil <= now) {
      record.lockedUntil = null;
      record.attempts = 0;
    }

    // Check if attempt window has expired
    if (record.lastAttempt && now - record.lastAttempt > ATTEMPT_WINDOW) {
      record.attempts = 0;
    }

    // Increment attempts
    record.attempts++;
    record.lastAttempt = now;

    // Lock if threshold exceeded (after 5 attempts)
    if (record.attempts > MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION;
    }

    return record;
  }

  async recordSuccessfulAttempt(email, agencyId) {
    const key = `${agencyId}:${email}`;
    this.store.delete(key);
    console.log(`✅ Login successful: ${email} (reset attempts)`);
  }

  async getAttemptRecord(email, agencyId) {
    const key = `${agencyId}:${email}`;
    return this.store.get(key);
  }

  async isAccountLocked(email, agencyId) {
    const record = await this.getAttemptRecord(email, agencyId);
    if (!record) return { locked: false };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        locked: true,
        lockedUntil: new Date(record.lockedUntil),
        minutesRemaining: Math.ceil((record.lockedUntil - now) / 60000)
      };
    }

    // Clean up expired lock
    if (record.lockedUntil && record.lockedUntil <= now) {
      record.lockedUntil = null;
      record.attempts = 0;
    }

    return { locked: false };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store) {
      // Remove records that haven't been accessed in 24 hours
      if (record.lastAttempt && now - record.lastAttempt > 24 * 60 * 60 * 1000) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

module.exports = new LoginAttemptService();
