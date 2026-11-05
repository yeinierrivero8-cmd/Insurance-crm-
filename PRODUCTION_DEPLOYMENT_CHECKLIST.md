# Production Deployment Checklist — Phase 3.3

**Status**: ✅ Production Ready  
**Last Updated**: 2026-11-05  
**Version**: 1.0.1

---

## PRE-DEPLOYMENT VERIFICATION

### Code Quality & Security
- [ ] All tests passing locally
  - [ ] E2E suite: Suite 1-5 (Full journey, performance, error resilience, security, mobile)
  - [ ] Performance benchmarks met (Dashboard < 2s, Search < 500ms)
  - [ ] Security audit passed (0 critical, 0 high vulnerabilities)
  - [ ] OWASP ZAP scan completed with no critical issues

### Build & Optimization
- [ ] Frontend build successful
  - [ ] `npm run build` completes without errors
  - [ ] No console errors in production build
  - [ ] Bundle size optimized (main.js < 150KB gzipped)
  - [ ] Code splitting working (vendor chunks separate)
  - [ ] Assets have content hashes for cache busting

- [ ] Backend ready
  - [ ] All environment variables configured (see `.env.example`)
  - [ ] Database migrations completed
  - [ ] Indexes created and validated
  - [ ] Rate limiting configured correctly

### Security Hardening
- [ ] Security headers enabled
  - [ ] CSP (Content-Security-Policy) configured
  - [ ] HSTS (Strict-Transport-Security) enabled
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff

- [ ] Secrets management
  - [ ] JWT secret rotated
  - [ ] Encryption key updated (min 32 chars)
  - [ ] Webhook secret configured
  - [ ] No secrets in `.env` file (only `.env.example`)
  - [ ] Secrets stored in secure vault (AWS Secrets Manager / Hashicorp Vault)

- [ ] CORS whitelist
  - [ ] Production domain only (no localhost)
  - [ ] Credentials: true (if needed)
  - [ ] Appropriate methods allowed

- [ ] Rate limiting
  - [ ] Login limiter: 5 attempts/15 min
  - [ ] General API: 100 requests/15 min
  - [ ] Strict endpoints: 10 requests/15 min
  - [ ] Skip disabled for production

### Database & Data
- [ ] Database backup completed
  - [ ] Full backup created before deployment
  - [ ] Backup tested and verified
  - [ ] Backup stored securely
  - [ ] Rollback procedure documented

- [ ] Data integrity
  - [ ] Foreign key constraints enabled
  - [ ] Audit logs enabled and tested
  - [ ] Data migration scripts tested
  - [ ] Soft deletes working correctly

### Performance & Caching
- [ ] Frontend caching
  - [ ] IndexedDB caching implemented
  - [ ] Cache TTL configured (clients: 5min, renewals: 10min, profile: 1h)
  - [ ] Cache invalidation working

- [ ] Server caching
  - [ ] Static assets: Cache-Control: max-age=2592000 (1 month)
  - [ ] API responses: Appropriate cache headers
  - [ ] Compression: gzip enabled (threshold: 1KB)

- [ ] Database optimization
  - [ ] Indexes created:
    - [ ] Clients: agency_id, status, created_at
    - [ ] Renewals: agency_id, status, due_date
    - [ ] Policies: client_id, status, expiry_date
    - [ ] Users: agency_id, email
    - [ ] Audit logs: user_id, entity_type, action
  - [ ] Query performance tested
  - [ ] No N+1 queries identified

### Testing Results
- [ ] Lighthouse audit scores
  - [ ] Performance: >= 90
  - [ ] Accessibility: >= 95
  - [ ] Best Practices: >= 95
  - [ ] SEO: >= 90

- [ ] RBAC validation
  - [ ] Admin can create/edit/delete clients
  - [ ] Agent can create/edit clients (not delete)
  - [ ] Viewer can only view (read-only)
  - [ ] Data isolation verified (user A cannot see user B's data)

- [ ] 2FA tested
  - [ ] QR code generation working
  - [ ] TOTP validation working
  - [ ] Backup codes generated and stored
  - [ ] Bypass prevention working

- [ ] Critical paths validated
  - [ ] User journey: Register → Login → Create Client → View Details → Logout
  - [ ] Renewals workflow: List → Filter → Update Status
  - [ ] Import/Export: CSV parsing, error handling
  - [ ] Mobile responsiveness: 375px, 768px, 1440px

### Monitoring & Observability
- [ ] Error tracking configured
  - [ ] Sentry initialized (if using)
  - [ ] Error thresholds configured
  - [ ] Alerts set up

- [ ] Performance monitoring
  - [ ] API response time monitoring
  - [ ] Error rate tracking
  - [ ] Uptime monitoring configured

- [ ] Logging
  - [ ] Audit logs: login, create, update, delete actions
  - [ ] Log rotation enabled (7-day retention)
  - [ ] Sensitive data not logged (passwords, tokens)
  - [ ] Application logs directory writable

### Documentation
- [ ] Production deployment guide created
  - [ ] Environment setup instructions
  - [ ] Database initialization steps
  - [ ] SSL/TLS certificate configuration
  - [ ] Backup and restore procedures

- [ ] Runbooks documented
  - [ ] Common troubleshooting steps
  - [ ] Incident response procedures
  - [ ] Rollback procedures
  - [ ] Database recovery steps

- [ ] Architecture documentation
  - [ ] System design diagrams
  - [ ] API contract specification
  - [ ] Database schema documentation
  - [ ] Security model documented

---

## DEPLOYMENT EXECUTION

### Pre-Deployment (T-0)
- [ ] **Database Backup**: Take full backup (timestamp it)
  ```bash
  sqlite3 insurance_crm.db ".backup 'insurance_crm_backup_$(date +%Y%m%d_%H%M%S).db'"
  ```

- [ ] **Health Check**: Verify all services
  - [ ] Backend: `curl http://localhost:5000/health`
  - [ ] Database: `curl http://localhost:5000/api/health/db`
  - [ ] Frontend: Build verification

- [ ] **Notification**: Inform stakeholders
  - [ ] Timeline: 5-10 minutes
  - [ ] Expected downtime: minimal (< 1 minute)
  - [ ] Rollback plan: documented

### Deployment (T-0 to T+5)
1. **[ ] Code Deployment**
   ```bash
   git pull origin main
   npm ci
   npm run build
   ```

2. **[ ] Database Migration** (if applicable)
   ```bash
   npm run db:migrate -- --prod
   ```

3. **[ ] Environment Configuration**
   - [ ] Update production `.env` file
   - [ ] Verify all required variables set
   - [ ] Restart backend service

4. **[ ] Frontend Deployment**
   - [ ] Deploy `dist/` directory to CDN/hosting
   - [ ] Verify HTML serving correctly
   - [ ] Test asset loading (CSS, JS, images)

5. **[ ] Service Verification**
   - [ ] Backend responding (HTTP 200)
   - [ ] Database connected
   - [ ] Static files serving
   - [ ] API endpoints working

### Post-Deployment (T+5 to T+15)
- [ ] **Smoke Tests**
  - [ ] Dashboard loads
  - [ ] Login works
  - [ ] Clients list displays
  - [ ] API responds within SLA

- [ ] **Monitoring Check**
  - [ ] Error rates normal (< 1%)
  - [ ] Response times acceptable (< 2s avg)
  - [ ] No database errors
  - [ ] No 5xx errors

- [ ] **User Notification**
  - [ ] Deployment successful message
  - [ ] Known issues (if any)
  - [ ] Next steps for users

---

## ROLLBACK PLAN

### Quick Rollback (< 2 minutes)
If critical issues detected immediately after deployment:

1. **Stop New Deployment**
   ```bash
   # Stop current backend service
   pkill -f "node backend/server.js"
   ```

2. **Restore Previous Version**
   ```bash
   # Revert code to previous release
   git checkout HEAD~1
   npm ci
   npm run build
   
   # Restart backend
   npm run dev:backend &
   ```

3. **Database Rollback** (if migration failed)
   ```bash
   # Restore from backup
   sqlite3 insurance_crm.db ".restore 'insurance_crm_backup_YYYYMMDD_HHMMSS.db'"
   ```

4. **Verify Rollback**
   - [ ] Backend responding
   - [ ] Database working
   - [ ] Frontend loading
   - [ ] Basic functionality working

### Gradual Rollback (Canary)
If issues develop after stabilization:

1. Route small percentage of traffic to old version (if using load balancer)
2. Monitor error rates and performance
3. Gradually shift more traffic back to old version
4. Complete rollback once old version proven stable

### Communication
- [ ] Notify users of rollback
- [ ] Document issue for post-mortem
- [ ] Schedule deployment fix
- [ ] Plan re-deployment with fixes

---

## POST-DEPLOYMENT VALIDATION

### 24-Hour Monitoring Period
- [ ] Error rate remains < 1%
- [ ] Response times stable (< 2s avg)
- [ ] No database corruption
- [ ] All scheduled tasks working (backups, etc.)
- [ ] Webhook deliveries successful (if any)

### 7-Day Validation
- [ ] No critical issues reported
- [ ] Performance metrics stable
- [ ] User adoption smooth
- [ ] All features working as expected

### Sign-Off
- [ ] Development Lead: _______________  Date: _______
- [ ] QA Lead: _______________  Date: _______
- [ ] Operations Lead: _______________  Date: _______

---

## INCIDENT RESPONSE

### Level 1: Critical (99.9% downtime)
- Immediate rollback
- Notify all stakeholders
- Post-mortem within 2 hours
- Fix required before re-deployment

### Level 2: High (> 1% error rate)
- Investigate root cause
- If unfixable: rollback
- If fixable: hotfix deployment

### Level 3: Medium (> 5% error rate)
- Document issue
- Plan fix for next deployment
- Monitor for escalation

---

## SIGN-OFF

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Status**: ☐ Success ☐ Rollback ☐ Pending

**Notes**:
_________________________________________________________________

---

**Next Steps**: Monitor for 24 hours, then proceed to long-term monitoring phase.
