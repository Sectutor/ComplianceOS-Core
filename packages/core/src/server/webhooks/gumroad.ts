/**
 * Gumroad Webhook Handler
 * 
 * Handles webhook events from Gumroad for license management:
 * - License validation events
 * - Subscription cancellations
 * - Refunds
 * - Chargebacks
 */

import express from 'express';
import crypto from 'crypto';
import { getDb } from '../../db';
import { gumroadWebhookEvents } from '../../schema/licenses';
import { eq, sql } from 'drizzle-orm';
import { config } from '../../lib/config';

const router = express.Router();

/**
 * Verify Gumroad webhook signature
 */
function verifyGumroadSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Gumroad signature:', error);
    return false;
  }
}

/**
 * Process Gumroad webhook event
 */
async function processGumroadEvent(eventData: any): Promise<void> {
  const db = await getDb();
  
  try {
    // Extract event metadata
    const eventId = eventData.id || crypto.randomUUID();
    const eventType = eventData.event || 'unknown';
    const gumroadTimestamp = eventData.timestamp || new Date().toISOString();
    const gumroadSignature = eventData.signature || '';
    
    // Store the webhook event for audit
    await db.insert(gumroadWebhookEvents).values({
      eventId,
      eventType,
      gumroadTimestamp,
      gumroadSignature,
      rawPayload: eventData,
      processingStatus: 'pending',
      receivedAt: new Date(),
    });
    
    console.log(`[Gumroad Webhook] Received event: ${eventType} (ID: ${eventId})`);
    
    // Process based on event type
    switch (eventType) {
      case 'license_validation':
        await processLicenseValidation(eventData);
        break;
        
      case 'subscription_cancelled':
        await processSubscriptionCancelled(eventData);
        break;
        
      case 'refund':
        await processRefund(eventData);
        break;
        
      case 'chargeback':
        await processChargeback(eventData);
        break;
        
      case 'sale':
        await processSale(eventData);
        break;
        
      case 'subscription_activated':
        await processSubscriptionActivated(eventData);
        break;
        
      case 'subscription_reactivated':
        await processSubscriptionReactivated(eventData);
        break;
        
      default:
        console.log(`[Gumroad Webhook] Unhandled event type: ${eventType}`);
        await db.update(gumroadWebhookEvents)
          .set({
            processingStatus: 'processed',
            processedAt: new Date(),
            processingError: `Unhandled event type: ${eventType}`,
          })
          .where(eq(gumroadWebhookEvents.eventId, eventId));
        break;
    }
    
    // Mark as processed
    await db.update(gumroadWebhookEvents)
      .set({
        processingStatus: 'processed',
        processedAt: new Date(),
      })
      .where(eq(gumroadWebhookEvents.eventId, eventId));
    
  } catch (error) {
    console.error(`[Gumroad Webhook] Error processing event:`, error);
    
    // Update event with error
    const db = await getDb();
    await db.update(gumroadWebhookEvents)
      .set({
        processingStatus: 'failed',
        processingError: error instanceof Error ? error.message : 'Unknown error',
        processingAttempts: 1,
      })
      .where(eq(gumroadWebhookEvents.eventId, eventData.id || 'unknown'));
  }
}

/**
 * Process license validation event
 */
async function processLicenseValidation(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing license validation:', eventData);
  
  const db = await getDb();
  const { license_key, product_permalink, valid, message } = eventData;
  
  if (!license_key || !product_permalink) {
    throw new Error('Missing license_key or product_permalink in license validation event');
  }
  
  // Update license activation status based on validation result
  // This would typically update the license_activations table
  // For now, just log the validation result
  console.log(`[Gumroad Webhook] License validation: ${license_key} for ${product_permalink} - Valid: ${valid}, Message: ${message}`);
  
  // TODO: Update license_activations table with validation result
  // await db.update(licenseActivations)
  //   .set({
  //     lastValidatedAt: new Date(),
  //     validationCount: sql`validation_count + 1`,
  //     lastValidationResult: { valid, message, validatedAt: new Date() },
  //   })
  //   .where(eq(licenseActivations.licenseKey, license_key));
}

/**
 * Process subscription cancelled event
 */
async function processSubscriptionCancelled(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing subscription cancelled:', eventData);
  
  const { subscription_id, product_permalink, cancelled_at } = eventData;
  
  if (!subscription_id) {
    throw new Error('Missing subscription_id in subscription cancelled event');
  }
  
  // Update license activation to mark as cancelled/expired
  console.log(`[Gumroad Webhook] Subscription cancelled: ${subscription_id} for ${product_permalink} at ${cancelled_at}`);
  
  // TODO: Update license_activations table to mark subscription as cancelled
  // await db.update(licenseActivations)
  //   .set({
  //     licenseStatus: 'expired',
  //     expiresAt: new Date(cancelled_at),
  //     metadata: sql`metadata || ${JSON.stringify({ subscriptionCancelled: true, cancelledAt: cancelled_at })}`,
  //   })
  //   .where(eq(licenseActivations.subscriptionId, subscription_id));
}

/**
 * Process refund event
 */
async function processRefund(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing refund:', eventData);
  
  const { sale_id, product_permalink, refunded_at, amount_cents } = eventData;
  
  if (!sale_id) {
    throw new Error('Missing sale_id in refund event');
  }
  
  // Update license activation to mark as refunded
  console.log(`[Gumroad Webhook] Refund: Sale ${sale_id} for ${product_permalink}, Amount: ${amount_cents} cents at ${refunded_at}`);
  
  // TODO: Update license_activations table to mark as refunded
  // await db.update(licenseActivations)
  //   .set({
  //     licenseStatus: 'revoked',
  //     metadata: sql`metadata || ${JSON.stringify({ refunded: true, refundedAt: refunded_at, refundAmountCents: amount_cents })}`,
  //   })
  //   .where(eq(licenseActivations.gumroadSaleId, sale_id));
}

/**
 * Process chargeback event
 */
async function processChargeback(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing chargeback:', eventData);
  
  const { sale_id, product_permalink, charged_back_at } = eventData;
  
  if (!sale_id) {
    throw new Error('Missing sale_id in chargeback event');
  }
  
  // Update license activation to mark as chargeback
  console.log(`[Gumroad Webhook] Chargeback: Sale ${sale_id} for ${product_permalink} at ${charged_back_at}`);
  
  // TODO: Update license_activations table to mark as chargeback
  // await db.update(licenseActivations)
  //   .set({
  //     licenseStatus: 'suspended',
  //     metadata: sql`metadata || ${JSON.stringify({ chargeback: true, chargedBackAt: charged_back_at })}`,
  //   })
  //   .where(eq(licenseActivations.gumroadSaleId, sale_id));
}

/**
 * Process sale event
 */
async function processSale(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing sale:', eventData);
  
  const { sale_id, product_permalink, license_key, email, full_name, price_cents, created_at } = eventData;
  
  if (!sale_id || !license_key) {
    throw new Error('Missing sale_id or license_key in sale event');
  }
  
  console.log(`[Gumroad Webhook] New sale: ${sale_id}, Product: ${product_permalink}, License: ${license_key}, Customer: ${email} (${full_name}), Price: ${price_cents} cents at ${created_at}`);
  
  // TODO: Create new license activation record
  // This would typically create a new entry in license_activations table
  // await db.insert(licenseActivations).values({
  //   licenseKey: license_key,
  //   licenseType: 'enterprise',
  //   licenseStatus: 'active',
  //   productPermalink: product_permalink,
  //   customerEmail: email,
  //   customerName: full_name,
  //   gumroadSaleId: sale_id,
  //   gumroadValidationData: eventData,
  //   issuedAt: new Date(created_at),
  //   activatedAt: new Date(),
  //   // Set expiration based on product type
  //   expiresAt: product_permalink.includes('monthly') 
  //     ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  //     : product_permalink.includes('yearly')
  //     ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  //     : null,
  //   isRecurring: product_permalink.includes('monthly') || product_permalink.includes('yearly'),
  //   recurrencePeriod: product_permalink.includes('monthly') ? 'monthly' : 
  //                    product_permalink.includes('yearly') ? 'yearly' : null,
  //   enabledFeatures: [], // Will be populated based on product
  //   metadata: {
  //     purchasePriceCents: price_cents,
  //     purchaseDate: created_at,
  //     productType: product_permalink,
  //   },
  // });
}

/**
 * Process subscription activated event
 */
async function processSubscriptionActivated(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing subscription activated:', eventData);
  
  const { subscription_id, product_permalink, activated_at } = eventData;
  
  if (!subscription_id) {
    throw new Error('Missing subscription_id in subscription activated event');
  }
  
  console.log(`[Gumroad Webhook] Subscription activated: ${subscription_id} for ${product_permalink} at ${activated_at}`);
  
  // TODO: Update license activation to mark as active
  // await db.update(licenseActivations)
  //   .set({
  //     licenseStatus: 'active',
  //     activatedAt: new Date(activated_at),
  //     metadata: sql`metadata || ${JSON.stringify({ subscriptionActivated: true, activatedAt: activated_at })}`,
  //   })
  //   .where(eq(licenseActivations.subscriptionId, subscription_id));
}

/**
 * Process subscription reactivated event
 */
async function processSubscriptionReactivated(eventData: any): Promise<void> {
  console.log('[Gumroad Webhook] Processing subscription reactivated:', eventData);
  
  const { subscription_id, product_permalink, reactivated_at } = eventData;
  
  if (!subscription_id) {
    throw new Error('Missing subscription_id in subscription reactivated event');
  }
  
  console.log(`[Gumroad Webhook] Subscription reactivated: ${subscription_id} for ${product_permalink} at ${reactivated_at}`);
  
  // TODO: Update license activation to mark as active again
  // await db.update(licenseActivations)
  //   .set({
  //     licenseStatus: 'active',
  //     metadata: sql`metadata || ${JSON.stringify({ subscriptionReactivated: true, reactivatedAt: reactivated_at })}`,
  //   })
  //   .where(eq(licenseActivations.subscriptionId, subscription_id));
}

/**
 * Gumroad webhook endpoint
 * POST /api/webhooks/gumroad
 */
router.post('/gumroad', async (req, res) => {
  try {
    // Get webhook secret from config
    const webhookSecret = config.gumroad?.webhookSecret;
    
    if (!webhookSecret) {
      console.error('[Gumroad Webhook] Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook configuration missing' });
    }
    
    // Get signature from headers
    const signature = req.headers['x-gumroad-signature'] as string;
    
    if (!signature) {
      console.error('[Gumroad Webhook] Missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }
    
    // Verify signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyGumroadSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('[Gumroad Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook asynchronously
    processGumroadEvent(req.body).catch(error => {
      console.error('[Gumroad Webhook] Async processing error:', error);
    });
    
    // Return success immediately (webhook processing is async)
    res.status(200).json({ status: 'received' });
    
  } catch (error) {
    console.error('[Gumroad Webhook] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook test endpoint (for development)
 * POST /api/webhooks/gumroad/test
 */
router.post('/gumroad/test', async (req, res) => {
  try {
    // This is a test endpoint that simulates webhook processing
    // It doesn't require signature verification
    
    console.log('[Gumroad Webhook Test] Received test webhook:', req.body);
    
    // Simulate processing
    const eventData = req.body;
    const db = await getDb();
    
    // Store test event
    await db.insert(gumroadWebhookEvents).values({
      eventId: `test-${Date.now()}`,
      eventType: eventData.event || 'test',
      rawPayload: eventData,
      processingStatus: 'processed',
      processedAt: new Date(),
      receivedAt: new Date(),
    });
    
    res.status(200).json({ 
      status: 'test_received',
      message: 'Test webhook processed successfully',
      eventId: `test-${Date.now()}`
    });
    
  } catch (error) {
    console.error('[Gumroad Webhook Test] Error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

/**
 * Webhook status endpoint
 * GET /api/webhooks/gumroad/status
 */
router.get('/gumroad/status', async (req, res) => {
  try {
    const db = await getDb();
    
    // Get recent webhook events
    const recentEvents = await db.query.gumroadWebhookEvents.findMany({
      orderBy: (events, { desc }) => [desc(events.receivedAt)],
      limit: 10,
    });
    
    // Get statistics
    const stats = await db.select({
      total: sql`COUNT(*)`,
      pending: sql`COUNT(*) FILTER (WHERE processing_status = 'pending')`,
      processing: sql`COUNT(*) FILTER (WHERE processing_status = 'processing')`,
      processed: sql`COUNT(*) FILTER (WHERE processing_status = 'processed')`,
      failed: sql`COUNT(*) FILTER (WHERE processing_status = 'failed')`,
    }).from(gumroadWebhookEvents);
    
    res.status(200).json({
      status: 'ok',
      config: {
        hasWebhookSecret: !!config.gumroad?.webhookSecret,
        webhookSecretLength: config.gumroad?.webhookSecret?.length || 0,
      },
      statistics: stats[0] || {},
      recentEvents,
    });
    
  } catch (error) {
    console.error('[Gumroad Webhook Status] Error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export { router as gumroadWebhookRouter };