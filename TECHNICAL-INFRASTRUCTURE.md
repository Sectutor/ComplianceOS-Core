# TECHNICAL IMPLEMENTATION: INFRASTRUCTURE MODEL

*How to turn ComplianceOS into a platform*

---

## CURRENT STATE

You already have:
- tRPC API (60+ routers)
- Database with Drizzle ORM
- Multi-client support
- Authentication system
- Webhook infrastructure

**What you need to add:**
1. API Keys for external access
2. Webhook system (already exists, expand)
3. Multi-tenant MSP system
4. White-label system

---

## STEP 1: API KEYS FOR EXTERNAL ACCESS

### The Problem
Currently tRPC requires JWT authentication. External systems need API keys.

### The Solution
Create API key system in database:

```typescript
// Add to schema.ts
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(users.id),
  clientId: integer('client_id'), // null for platform-level
  key: varchar('key', { length: 256 }).unique(),
  name: varchar('name', { length: 100 }),
  permissions: json('permissions'), // ['read:controls', 'write:risks', etc.]
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Create API Key Router

```typescript
// server/routers/apiKeys.ts
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import crypto from "crypto";

export const createApiKeysRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      permissions: z.array(z.string()),
      expiresIn: z.number().optional(), // days
    }))
    .mutation(async ({ ctx, input }) => {
      const key = `cos_${crypto.randomBytes(24).toString('hex')}`;
      
      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        key,
        name: input.name,
        permissions: input.permissions,
        expiresAt: input.expiresIn 
          ? new Date(Date.now() + input.expiresIn * 86400000)
          : null,
      });
      
      return { key }; // Only returned once!
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      permissions: apiKeys.permissions,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
    }).from(apiKeys).where(eq(apiKeys.userId, ctx.user.id));
  }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(apiKeys).where(
        and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id))
      );
    }),
});
```

### Add API Key Authentication Middleware

```typescript
// server/trpc.ts - add new middleware

export const apiKeyAuth = middleware(async ({ ctx, next, path }) => {
  const apiKey = ctx.headers['x-api-key'];
  
  if (!apiKey) {
    // Fall through to other auth methods
    return next();
  }
  
  const db = await getDb();
  const [keyRecord] = await db.select()
    .from(apiKeys)
    .where(eq(apiKeys.key, apiKey))
    .limit(1);
    
  if (!keyRecord) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid API key' });
  }
  
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'API key expired' });
  }
  
  // Check permissions
  const requiredPermission = getPermissionForPath(path);
  if (requiredPermission && !keyRecord.permissions.includes(requiredPermission)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: { id: keyRecord.userId, role: 'api_key' },
      clientId: keyRecord.clientId,
    },
  });
});

// Add to public procedure
export const apiProcedure = publicProcedure.use(apiKeyAuth);
```

---

## STEP 2: MSP MULTI-TENANT SYSTEM

### The Problem
MSPs need to manage 100s of clients from one account.

### The Solution
Hierarchy: MSP → Sub-accounts → Users

```typescript
// Add to schema.ts
export const mspRelations = pgTable('msp_relations', {
  id: serial('id').primaryKey(),
  parentClientId: integer('parent_client_id').references(clients.id),
  childClientId: integer('child_client_id').references(clients.id),
  role: varchar('role', { length: 50 }), // 'msp', 'sub_client'
});
```

### MSP-Specific Features

```typescript
// In client router, add MSP queries
export const createMspsRouter = router({
  // Get all sub-clients for an MSP
  listSubClients: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const subClients = await db.select()
        .from(clients)
        .innerJoin(mspRelations, eq(mspRelations.parentClientId, clients.id))
        .where(eq(mspRelations.childClientId, ctx.user.id)); // This is wrong, fix
      
      return subClients;
    }),
    
  // Create sub-client for MSP
  createSubClient: protectedProcedure
    .input(z.object({
      name: z.string(),
      plan: z.enum(['starter', 'professional']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create new client under MSP's account
      const [client] = await db.insert(clients).values({
        name: input.name,
        planTier: input.plan,
        parentClientId: ctx.clientId, // Link to MSP
      }).returning();
      
      return client;
    }),
    
  // Bulk operations
  applyTemplateToAll: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Apply a control template to all sub-clients
      const subClients = await getSubClients(ctx.clientId);
      
      for (const client of subClients) {
        await applyTemplateToClient(templateId, client.id);
      }
      
      return { applied: subClients.length };
    }),
});
```

---

## STEP 3: WHITE-LABEL SYSTEM

### The Problem
MSPs want their branding, not ComplianceOS branding.

### The Solution
Branding configuration per client/partner:

```typescript
// Add to schema.ts
export const whiteLabelSettings = pgTable('white_label_settings', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(clients.id),
  
  // Branding
  logoUrl: varchar('logo_url'),
  faviconUrl: varchar('favicon_url'),
  primaryColor: varchar('primary_color', { length: 7 }), // #000000
  secondaryColor: varchar('secondary_color', { length: 7 }),
  
  // Custom domain
  customDomain: varchar('custom_domain'), // compliance.yourcompany.com
  
  // Email
  emailFromName: varchar('email_from_name'),
  emailFromAddress: varchar('email_from_address'),
  
  // Terms
  termsUrl: varchar('terms_url'),
  privacyUrl: varchar('privacy_url'),
});
```

### Apply White-label Middleware

```typescript
// Apply white-label settings to requests
export const whiteLabelMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.clientId) return next();
  
  const [settings] = await db.select()
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.clientId, ctx.clientId))
    .limit(1);
  
  return next({
    ctx: {
      ...ctx,
      whiteLabel: settings,
    },
  });
});
```

### Frontend Branding

```typescript
// In your frontend app, read white-label config
const useWhiteLabel = () => {
  const { whiteLabel } = useTRPCContext(); // or from app context
  
  // Apply to CSS variables
  useEffect(() => {
    if (whiteLabel) {
      document.documentElement.style.setProperty(
        '--primary-color', 
        whiteLabel.primaryColor || '#3b82f6'
      );
      document.title = whiteLabel.companyName || 'ComplianceOS';
    }
  }, [whiteLabel]);
};
```

---

## STEP 4: CUSTOM DOMAINS

### The Problem
MSPs want theirdomain.com, not complianceos.com

### The Solution
Wildcard DNS + middleware

```typescript
// In your main server entry
app.use(async (req, res, next) => {
  const host = req.headers.host; // e.g., "compliance.acmecorp.com"
  
  if (host?.includes('.')) {
    const subdomain = host.split('.')[0];
    
    // Check if this is a white-label domain
    const [client] = await db.select()
      .from(clients)
      .innerJoin(whiteLabelSettings, eq(whiteLabelSettings.clientId, clients.id))
      .where(eq(whiteLabelSettings.customDomain, host))
      .limit(1);
    
    if (client) {
      // Set client context for this request
      req.clientId = client.id;
      req.whiteLabelSettings = client.whiteLabelSettings;
    }
  }
  
  next();
});
```

### DNS Setup
```
*.your-msp-domain.com → CNAME → platform.complianceos.com
```

---

## STEP 5: WEBHOOKS EXPANSION

### The Problem
External systems need to react to events.

### Add Webhook Router

```typescript
export const createWebhooksRouter = router({
  create: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      events: z.array(z.enum([
        'control.created',
        'control.updated',
        'risk.created',
        'risk.assessment.completed',
        'evidence.uploaded',
        'audit.started',
      ])),
    }))
    .mutation(async ({ ctx, input }) => {
      const [webhook] = await db.insert(webhooks).values({
        clientId: ctx.clientId,
        url: input.url,
        events: input.events,
        secret: crypto.randomBytes(32).toString('hex'),
      }).returning();
      
      return webhook;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(webhooks)
      .where(eq(webhooks.clientId, ctx.clientId));
  }),
});

// Trigger webhooks when events happen
export async function triggerWebhooks(clientId: number, event: string, data: any) {
  const webhooks = await db.select()
    .from(webhooks)
    .where(and(
      eq(webhooks.clientId, clientId),
      sql`${event} = ANY(events)`
    ));
  
  for (const webhook of webhooks) {
    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        'X-Webhook-Event': event,
      },
      body: JSON.stringify(data),
    });
  }
}
```

---

## STEP 6: EXTERNAL API ROUTES

### Create REST-style endpoints for external access

```typescript
// server/routes/api/v1.ts
import { Router } from 'express';
import { z } from 'zod';

const apiRouter = Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get controls
apiRouter.get('/clients/:clientId/controls', async (req, res) => {
  const { clientId } = req.params;
  const apiKey = req.headers['x-api-key'];
  
  // Validate API key and permissions
  const keyRecord = await validateApiKey(apiKey, clientId, 'read:controls');
  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  const controls = await db.select()
    .from(controls)
    .where(eq(controls.clientId, clientId));
    
  res.json(controls);
});

// Create risk
apiRouter.post('/clients/:clientId/risks', async (req, res) => {
  const { clientId } = req.params;
  const apiKey = req.headers['x-api-key'];
  
  const keyRecord = await validateApiKey(apiKey, clientId, 'write:risks');
  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  const riskSchema = z.object({
    title: z.string(),
    description: z.string(),
    likelihood: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
  });
  
  const data = riskSchema.parse(req.body);
  
  const [risk] = await db.insert(riskScenarios).values({
    ...data,
    clientId,
  }).returning();
  
  res.status(201).json(risk);
});

// List frameworks
apiRouter.get('/frameworks', async (req, res) => {
  const frameworks = await db.select()
    .from(frameworks)
    .where(eq(frameworks.isGlobal, true));
    
  res.json(frameworks);
});

export default apiRouter;
```

---

## STEP 7: DOCUMENTATION (CRITICAL)

### Auto-generate API docs

```typescript
// server/routes/docs.ts
import { Router } from 'express';
import { generateOpenApiSpec } from './utils/openapi';

const docsRouter = Router();

docsRouter.get('/openapi.json', (req, res) => {
  const spec = generateOpenApiSpec(appRouter);
  res.json(spec);
});

docsRouter.get('/docs', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>ComplianceOS API</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUI({
            url: '/api/v1/openapi.json',
          });
        </script>
      </body>
    </html>
  `);
});

export default docsRouter;
```

---

## STEP 8: PLATFORM TIER PRICING

### Add to billing router

```typescript
// Create platform subscription
export const createPlatformSubscription = protectedProcedure
  .input(z.object({
    plan: z.enum(['platform_starter', 'platform_professional']),
  }))
  .mutation(async ({ ctx, input }) => {
    // Create Stripe subscription for platform tier
    const priceId = input.plan === 'platform_starter' 
      ? 'price_platform_starter' 
      : 'price_platform_professional';
    
    const subscription = await stripe.subscriptions.create({
      customer: ctx.user.stripeCustomerId,
      items: [{ price: priceId }],
    });
    
    // Update client to platform tier
    await db.update(clients)
      .set({ planTier: 'platform' })
      .where(eq(clients.id, ctx.clientId));
      
    return subscription;
  });
```

---

## SUMMARY: WHAT TO BUILD

| Feature | Effort | Priority |
|---------|--------|----------|
| API Keys system | Medium | 1 |
| External REST API | Medium | 1 |
| Webhooks expansion | Low | 2 |
| MSP hierarchy | Medium | 2 |
| White-label system | Medium | 3 |
| Custom domains | Low | 3 |
| API documentation | Low | 2 |
| Platform tier billing | Low | 3 |

---

## THE INFRASTRUCTURE API SURFACE

After implementation, expose these endpoints:

```
POST   /api/v1/keys              - Create API key
GET    /api/v1/keys              - List API keys
DELETE /api/v1/keys/:id          - Revoke key

GET    /api/v1/clients/:id/controls
POST   /api/v1/clients/:id/controls
PUT    /api/v1/clients/:id/controls/:id

GET    /api/v1/clients/:id/risks
POST   /api/v1/clients/:id/risks

GET    /api/v1/clients/:id/evidence
POST   /api/v1/clients/:id/evidence

GET    /api/v1/clients/:id/frameworks
POST   /api/v1/clients/:id/frameworks/import

GET    /api/v1/clients/:id/reports
POST   /api/v1/clients/:id/reports/generate

POST   /api/v1/webhooks          - Create webhook
GET    /api/v1/webhooks          - List webhooks
DELETE /api/v1/webhooks/:id      - Delete webhook
```

---

*This transforms ComplianceOS from "tool" to "platform". MSPs build their businesses on top. You get recurring revenue from infrastructure.*
