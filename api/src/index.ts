import Stripe from 'stripe';

// Environment bindings
interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  AI: Ai;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID_MONTHLY: string;
  STRIPE_PRICE_ID_YEARLY: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

// Style presets for cloud AI generation
const STYLE_PRESETS: Record<string, string> = {
  default: '',
  gameboy: ', Game Boy green monochrome palette, 4 shades of green',
  nes: ', NES 8-bit style, limited color palette, scanlines',
  commodore: ', Commodore 64 aesthetic, CRT monitor effect',
};

// Types
interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
  updated_at: number;
}

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: number | null;
  created_at: number;
  updated_at: number;
}

interface UsageCount {
  count: number;
}

// Helper: Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper: Get current timestamp
function now(): number {
  return Date.now();
}

// Helper: CORS headers
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Helper: JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

// Helper: Error response
function errorResponse(code: string, message: string, status = 400): Response {
  return jsonResponse({ error: { code, message } }, status);
}

// Helper: Verify JWT token and get user_id
async function verifyAuth(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Simple JWT verification (in production, use a proper JWT library)
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureData, dataToVerify);
    if (!isValid) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

// Helper: Create JWT token
async function createToken(userId: string, env: Env): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${headerB64}.${payloadB64}`));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Helper: Hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Route: GET /api/user/me
async function handleGetUserMe(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  // Get user
  const user = await env.DB.prepare(
    'SELECT id, email, name, created_at, updated_at FROM user WHERE id = ?'
  ).bind(userId).first<User>();

  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Get subscription
  const subscription = await env.DB.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first<Subscription>();

  // Get usage this week (last 7 days = 604800000 ms)
  const weekAgo = now() - 604800000;
  const usageResult = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM usage_tracking 
     WHERE user_id = ? AND action = 'image_generated' AND created_at > ?`
  ).bind(userId, weekAgo).first<UsageCount>();

  const imagesThisWeek = usageResult?.count || 0;
  const isPremium = subscription?.status === 'active';
  const limit = isPremium ? 999 : 3;

  return jsonResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    subscription: subscription || null,
    usage: {
      images_this_week: imagesThisWeek,
      limit,
    },
  });
}

// Route: POST /api/subscription/checkout
async function handleCheckout(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  // Parse body
  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid JSON body', 400);
  }

  const { plan } = body;
  if (!plan || !['premium_monthly', 'premium_yearly'].includes(plan)) {
    return errorResponse('INVALID_PLAN', 'Plan must be premium_monthly or premium_yearly', 400);
  }

  // Get user email
  const user = await env.DB.prepare(
    'SELECT email FROM user WHERE id = ?'
  ).bind(userId).first<{ email: string }>();

  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Initialize Stripe
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  // Check if user already has a Stripe customer ID
  let subscription = await env.DB.prepare(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first<{ stripe_customer_id: string | null }>();

  let customerId = subscription?.stripe_customer_id;

  // Create Stripe customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: userId },
    });
    customerId = customer.id;

    // Save or update subscription record with customer ID
    if (subscription) {
      await env.DB.prepare(
        'UPDATE subscriptions SET stripe_customer_id = ?, updated_at = ? WHERE user_id = ?'
      ).bind(customerId, now(), userId).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO subscriptions (id, user_id, stripe_customer_id, plan, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), userId, customerId, 'free', 'inactive', now(), now()).run();
    }
  }

  // Get price ID based on plan
  const priceId = plan === 'premium_monthly' 
    ? env.STRIPE_PRICE_ID_MONTHLY 
    : env.STRIPE_PRICE_ID_YEARLY;

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'vellumeapp://subscription/success',
    cancel_url: 'vellumeapp://subscription/cancel',
    metadata: { user_id: userId, plan },
  });

  return jsonResponse({ checkout_url: session.url });
}

// Route: POST /api/webhooks/stripe
async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return errorResponse('MISSING_SIGNATURE', 'Missing stripe-signature header', 400);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return errorResponse('INVALID_SIGNATURE', 'Invalid webhook signature', 400);
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || 'premium_monthly';
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        // Get subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = stripeSubscription.current_period_end * 1000;

        // Update subscription in database
        await env.DB.prepare(
          `UPDATE subscriptions 
           SET stripe_subscription_id = ?, plan = ?, status = 'active', current_period_end = ?, updated_at = ?
           WHERE user_id = ?`
        ).bind(subscriptionId, plan, currentPeriodEnd, now(), userId).run();
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'active' : subscription.status;
      const currentPeriodEnd = subscription.current_period_end * 1000;

      await env.DB.prepare(
        `UPDATE subscriptions 
         SET status = ?, current_period_end = ?, updated_at = ?
         WHERE stripe_customer_id = ?`
      ).bind(status, currentPeriodEnd, now(), customerId).run();
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await env.DB.prepare(
        `UPDATE subscriptions 
         SET status = 'canceled', updated_at = ?
         WHERE stripe_customer_id = ?`
      ).bind(now(), customerId).run();
      break;
    }
  }

  return jsonResponse({ received: true });
}

// Route: POST /api/images/upload
async function handleImageUpload(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  // Check usage limit
  const subscription = await env.DB.prepare(
    'SELECT status FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first<{ status: string }>();

  const isPremium = subscription?.status === 'active';

  if (!isPremium) {
    // Check weekly usage
    const weekAgo = now() - 604800000;
    const usageResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking 
       WHERE user_id = ? AND action = 'image_generated' AND created_at > ?`
    ).bind(userId, weekAgo).first<UsageCount>();

    const imagesThisWeek = usageResult?.count || 0;
    if (imagesThisWeek >= 3) {
      return errorResponse(
        'LIMIT_REACHED',
        'Upgrade to Premium for unlimited images',
        403
      );
    }
  }

  // Parse form data
  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const entryId = formData.get('entry_id') as string | null;

  if (!image) {
    return errorResponse('MISSING_IMAGE', 'Image file is required', 400);
  }

  // Generate unique filename
  const ext = image.name.split('.').pop() || 'png';
  const filename = `${userId}/${generateId()}.${ext}`;

  // Upload to R2
  await env.IMAGES.put(filename, image.stream(), {
    httpMetadata: { contentType: image.type },
  });

  const imageUrl = `https://images.vellume.app/${filename}`;

  // Update entry if entry_id provided
  if (entryId) {
    await env.DB.prepare(
      'UPDATE entry SET image_url = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(imageUrl, now(), entryId, userId).run();
  }

  // Track usage
  await env.DB.prepare(
    'INSERT INTO usage_tracking (id, user_id, action, created_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), userId, 'image_generated', now()).run();

  return jsonResponse({ image_url: imageUrl });
}

// Route: POST /api/auth/signup
async function handleSignup(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid JSON body', 400);
  }

  const { email, password, name } = body;

  if (!email || !password) {
    return errorResponse('MISSING_FIELDS', 'Email and password are required', 400);
  }

  try {
    // Check if user exists
    const existing = await env.DB.prepare(
      'SELECT id FROM user WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return errorResponse('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Create user
    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const timestamp = now();

    await env.DB.prepare(
      'INSERT INTO user (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, name || null, passwordHash, timestamp, timestamp).run();

    // Create token
    const token = await createToken(userId, env);

    return jsonResponse({
      user: { id: userId, email, name: name || null },
      token,
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse('SIGNUP_FAILED', `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// Route: POST /api/auth/login
async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid JSON body', 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return errorResponse('MISSING_FIELDS', 'Email and password are required', 400);
  }

  // Get user
  const user = await env.DB.prepare(
    'SELECT id, email, name, password_hash FROM user WHERE email = ?'
  ).bind(email).first<{ id: string; email: string; name: string | null; password_hash: string }>();

  if (!user) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Verify password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.password_hash) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Create token
  const token = await createToken(user.id, env);

  return jsonResponse({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
}

// Route: GET /api/entries
async function handleGetEntries(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  const entries = await env.DB.prepare(
    'SELECT * FROM entry WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return jsonResponse({ entries: entries.results });
}

// Route: POST /api/entries (also /api/journals)
async function handleCreateEntry(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  let body: { content?: string; entry_text?: string; mood?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid JSON body', 400);
  }

  // Support both 'content' and 'entry_text' field names
  const content = body.content || body.entry_text;
  if (!content) {
    return errorResponse('MISSING_CONTENT', 'Content is required', 400);
  }

  const entryId = generateId();
  const timestamp = now();

  try {
    await env.DB.prepare(
      'INSERT INTO entry (id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(entryId, userId, content, timestamp, timestamp).run();

    // Return response with 'id' at top level for compatibility with frontend
    return jsonResponse({
      id: entryId,
      entry: { id: entryId, user_id: userId, content, created_at: timestamp, updated_at: timestamp },
    }, 201);
  } catch (error) {
    console.error('Create entry error:', error);
    return errorResponse('CREATE_FAILED', `Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// Route: GET /api/entries/:id
async function handleGetEntry(request: Request, env: Env, entryId: string): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  const entry = await env.DB.prepare(
    'SELECT * FROM entry WHERE id = ? AND user_id = ?'
  ).bind(entryId, userId).first();

  if (!entry) {
    return errorResponse('ENTRY_NOT_FOUND', 'Entry not found', 404);
  }

  return jsonResponse({ entry });
}

// Route: POST /api/images/generate-cloud
async function handleCloudGeneration(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing authentication token', 401);
  }

  // Check subscription status
  const subscription = await env.DB.prepare(
    'SELECT status FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first<{ status: string }>();

  const isPremium = subscription?.status === 'active';

  // Check usage limit for free users (3 images per week)
  if (!isPremium) {
    const weekAgo = now() - 604800000;
    const usageResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking
       WHERE user_id = ? AND (action = 'image_generated' OR action = 'cloud_image_generated') AND created_at > ?`
    ).bind(userId, weekAgo).first<UsageCount>();

    const imagesThisWeek = usageResult?.count || 0;
    if (imagesThisWeek >= 3) {
      return errorResponse(
        'LIMIT_REACHED',
        'You have reached your weekly limit of 3 AI images. Upgrade to Premium for unlimited generations.',
        403
      );
    }
  }

  // Parse body
  let body: { entry_text?: string; journal_id?: string; style?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('INVALID_BODY', 'Invalid JSON body', 400);
  }

  const { entry_text, journal_id, style = 'default' } = body;

  if (!entry_text) {
    return errorResponse('MISSING_TEXT', 'Entry text is required', 400);
  }

  if (!journal_id) {
    return errorResponse('MISSING_JOURNAL_ID', 'Journal ID is required', 400);
  }

  // Build prompt with style preset
  const styleModifier = STYLE_PRESETS[style] || '';
  const prompt = `${entry_text}, pixel art style, 8-bit graphics, retro gaming aesthetic, vibrant colors, nostalgic feel, clean pixel edges${styleModifier}`;

  const startTime = Date.now();
  let imageBuffer: Uint8Array | null = null;
  let retries = 0;
  const maxRetries = 2;

  // Retry logic for AI generation
  while (retries <= maxRetries) {
    try {
      const response = await env.AI.run(
        '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        {
          prompt,
          num_steps: 20,
          guidance: 7.5,
        }
      );

      // Response is a ReadableStream or Uint8Array
      const aiResponse = response as unknown;
      if (aiResponse instanceof ReadableStream) {
        const reader = aiResponse.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        imageBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          imageBuffer.set(chunk, offset);
          offset += chunk.length;
        }
      } else if (aiResponse instanceof Uint8Array) {
        imageBuffer = aiResponse;
      } else {
        // Assume it's an ArrayBuffer or similar
        imageBuffer = new Uint8Array(aiResponse as ArrayBuffer);
      }

      break; // Success, exit retry loop
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error('AI generation failed after retries:', error);
        return errorResponse(
          'AI_GENERATION_FAILED',
          'AI generation temporarily unavailable, please try again',
          503
        );
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }

  if (!imageBuffer) {
    return errorResponse('AI_GENERATION_FAILED', 'Failed to generate image', 500);
  }

  const generationTime = Date.now() - startTime;

  // Generate R2 key and upload
  const filename = `${userId}/${journal_id}-cloud.png`;
  await env.IMAGES.put(filename, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  const imageUrl = `https://images.vellume.app/${filename}`;

  // Update journal with image URL
  await env.DB.prepare(
    'UPDATE entry SET image_url = ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).bind(imageUrl, now(), journal_id, userId).run();

  // Track usage
  await env.DB.prepare(
    'INSERT INTO usage_tracking (id, user_id, action, created_at) VALUES (?, ?, ?, ?)'
  ).bind(generateId(), userId, 'cloud_image_generated', now()).run();

  return jsonResponse({
    image_url: imageUrl,
    generation_time_ms: generationTime,
  });
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Wrap all responses to ensure CORS headers are always present
    let response: Response;
    
    // Route matching
    try {
      // Auth routes
      if (path === '/api/auth/signup' && method === 'POST') {
        response = await handleSignup(request, env);
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(request, env);
      }
      // User routes
      else if (path === '/api/user/me' && method === 'GET') {
        response = await handleGetUserMe(request, env);
      }
      // Subscription routes
      else if (path === '/api/subscription/checkout' && method === 'POST') {
        response = await handleCheckout(request, env);
      }
      // Webhook routes (no auth required)
      else if (path === '/api/webhooks/stripe' && method === 'POST') {
        response = await handleStripeWebhook(request, env);
      }
      // Image routes
      else if (path === '/api/images/upload' && method === 'POST') {
        response = await handleImageUpload(request, env);
      } else if (path === '/api/images/generate-cloud' && method === 'POST') {
        response = await handleCloudGeneration(request, env);
      }
      // Entry routes (support both /api/entries and /api/journals)
      else if ((path === '/api/entries' || path === '/api/journals') && method === 'GET') {
        response = await handleGetEntries(request, env);
      } else if ((path === '/api/entries' || path === '/api/journals') && method === 'POST') {
        response = await handleCreateEntry(request, env);
      }
      // Entry by ID (support both /api/entries/:id and /api/journals/:id)
      else {
        const entryMatch = path.match(/^\/api\/(entries|journals)\/([^/]+)$/);
        if (entryMatch && method === 'GET') {
          response = await handleGetEntry(request, env, entryMatch[2]);
        } else {
          // 404 for unknown routes
          response = errorResponse('NOT_FOUND', 'Route not found', 404);
        }
      }
    } catch (error) {
      console.error('Request error:', error);
      response = errorResponse('INTERNAL_ERROR', 'Internal server error', 500);
    }

    // Ensure CORS headers are always present on the response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
