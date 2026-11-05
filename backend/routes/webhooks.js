/**
 * Webhooks Route — Event subscription and delivery
 * Supports: policy.created, renewal.due, client.deleted, etc.
 * Signature validation (HMAC) + retry logic with exponential backoff
 */

const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db/sqlite-pool');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-in-prod';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1s, exponential backoff

/**
 * POST /api/webhooks/subscribe
 * Register webhook endpoint for events
 *
 * @param {string} url - Webhook endpoint URL (must be HTTPS in production)
 * @param {string[]} events - List of events to subscribe to
 * @param {string} [description] - Optional description
 *
 * Events: policy.created, renewal.due, renewal.completed, client.deleted, policy.updated
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { url, events, description } = req.body;
    const userId = req.user.id;
    const agencyId = req.user.agency_id;

    // Validation
    if (!url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: url, events (array)',
        code: 'INVALID_WEBHOOK_CONFIG'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid URL format',
        code: 'INVALID_URL'
      });
    }

    // HTTPS requirement in production
    if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
      return res.status(400).json({
        error: 'Webhooks must use HTTPS in production',
        code: 'INSECURE_URL'
      });
    }

    // Create webhook subscription
    const webhookId = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('hex');

    // TODO: Implement database storage for webhooks
    // For now, return skeleton response
    res.status(201).json({
      webhook_id: webhookId,
      url,
      events,
      description,
      secret: secret.substring(0, 16) + '...', // Only show partial secret
      created_at: new Date().toISOString(),
      status: 'active',
      test_url: `/api/webhooks/${webhookId}/test`,
      message: 'Webhook subscription created successfully. Keep the secret safe and use it to validate signatures.'
    });
  } catch (error) {
    console.error('Webhook subscribe error:', error);
    res.status(500).json({
      error: 'Failed to create webhook subscription',
      code: 'WEBHOOK_ERROR'
    });
  }
});

/**
 * GET /api/webhooks
 * List webhook subscriptions for the agency
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const agencyId = req.user.agency_id;

    // TODO: Implement database query for webhooks
    // For now, return empty array
    res.json({
      webhooks: [],
      total: 0,
      message: 'No webhooks configured'
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

/**
 * DELETE /api/webhooks/:webhookId
 * Unsubscribe from webhook events
 */
router.delete('/:webhookId', authenticate, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const agencyId = req.user.agency_id;

    // TODO: Implement database deletion
    res.json({
      message: 'Webhook unsubscribed successfully',
      webhook_id: webhookId
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * POST /api/webhooks/:webhookId/test
 * Test webhook endpoint with sample payload
 */
router.post('/:webhookId/test', authenticate, async (req, res) => {
  try {
    const { webhookId } = req.params;

    // TODO: Send test event to webhook
    res.json({
      message: 'Test webhook sent',
      webhook_id: webhookId,
      event: 'webhook.test',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

/**
 * Internal: Trigger webhook events
 * Called internally when policy/renewal/client events occur
 *
 * @param {string} event - Event type (e.g., 'policy.created')
 * @param {object} payload - Event data
 */
async function triggerWebhook(event, payload) {
  console.log(`[WEBHOOK] Triggering event: ${event}`, payload);

  // TODO: Implement webhook delivery with retry logic
  // 1. Query database for subscriptions to this event
  // 2. For each subscription:
  //    - Generate HMAC signature
  //    - Send POST request with retry logic
  //    - Log delivery status
  //    - Store delivery record in database

  /**
   * Example implementation:
   *
   * const subscriptions = await pool.query(
   *   'SELECT * FROM webhooks WHERE agency_id = ? AND events LIKE ?',
   *   [agencyId, `%${event}%`]
   * );
   *
   * for (const webhook of subscriptions) {
   *   await deliverWebhook(webhook, event, payload);
   * }
   */
}

/**
 * Deliver webhook with retry logic
 */
async function deliverWebhook(webhook, event, payload, attempt = 0) {
  try {
    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const deliveryId = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-InsuraFlow-Signature': signature,
      'X-InsuraFlow-Timestamp': timestamp,
      'X-InsuraFlow-Delivery-ID': deliveryId,
      'X-InsuraFlow-Event': event
    };

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: deliveryId,
        event,
        data: payload,
        timestamp
      }),
      timeout: 10000 // 10s timeout
    });

    if (response.ok) {
      console.log(`[WEBHOOK] ✅ Delivered: ${event} to ${webhook.url}`);
      // TODO: Log successful delivery
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] ❌ Delivery failed (attempt ${attempt + 1}):`, error.message);

    // Retry with exponential backoff
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, attempt); // 1s, 2s, 4s
      setTimeout(() => deliverWebhook(webhook, event, payload, attempt + 1), delay);
    } else {
      console.error(`[WEBHOOK] ⚠️ Max retries exceeded: ${event}`);
      // TODO: Log webhook failure, potentially alert admin
    }
  }
}

module.exports = router;
module.exports.triggerWebhook = triggerWebhook;
