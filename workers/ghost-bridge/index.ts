interface Env {
	STRIPE_SECRET_KEY?: string;
	STRIPE_TRIAL_DAYS?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	CLERK_SECRET_KEY?: string;
	CLERK_API_URL?: string;
	TURSO_DATABASE_URL?: string;
	TURSO_AUTH_TOKEN?: string;
}

type BillingCheckoutBody = {
	priceId?: string;
	tierName?: string;
	clerkUserId?: string;
	email?: string;
	successUrl?: string;
	cancelUrl?: string;
};

type BillingPortalBody = {
	stripeCustomerId?: string;
	clerkUserId?: string;
	email?: string;
	returnUrl?: string;
};

type AuthContext = {
	userId: string;
	email?: string;
	sessionId?: string;
};

const json = (request: Request, body: unknown, status = 200) => {
	const origin = request.headers.get('Origin') || '*';
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Content-Type': 'application/json',
			'Vary': 'Origin'
		}
	});
};

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

const timingSafeEqual = (a: string, b: string) => {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let index = 0; index < a.length; index += 1) {
		result |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}
	return result === 0;
};

const getClerkApiUrl = (env: Env) => (env.CLERK_API_URL || 'https://api.clerk.com').replace(/\/$/, '');

const verifyClerkToken = async (request: Request, env: Env): Promise<AuthContext> => {
	const authHeader = request.headers.get('Authorization') || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

	if (!token) {
		throw new Error('Missing Clerk bearer token.');
	}
	if (!env.CLERK_SECRET_KEY) {
		throw new Error('Clerk is not configured on the Worker.');
	}

	const response = await fetch(`${getClerkApiUrl(env)}/v1/sessions/verify`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token })
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(typeof payload?.errors?.[0]?.message === 'string' ? payload.errors[0].message : 'Invalid Clerk session.');
	}

	const userId = payload?.response?.user_id || payload?.user_id;
	if (!userId) {
		throw new Error('Clerk verification did not return a user.');
	}

	return {
		userId,
		email: payload?.response?.last_active_organization_id || undefined,
		sessionId: payload?.response?.id || payload?.id || undefined
	};
};

const queryTurso = async (env: Env, sql: string, args: any[] = []) => {
	if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
		throw new Error('Turso is not configured on the Worker.');
	}

	const response = await fetch(`${env.TURSO_DATABASE_URL}/v2/pipeline`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			requests: [
				{ type: 'execute', stmt: { sql, args: args.map(arg => {
					if (typeof arg === 'string') return { type: 'text', value: arg };
					if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
					if (arg === null) return { type: 'null' };
					return { type: 'text', value: String(arg) };
				}) } },
				{ type: 'close' }
			]
		})
	});

	const payload = await response.json() as any;
	if (!response.ok) {
		throw new Error(payload?.error || 'Turso request failed.');
	}

	const result = payload?.results?.[0]?.response?.result;
	if (!result) return { rows: [] };

	const columns = result.cols.map((c: any) => c.name);
	const rows = result.rows.map((row: any) => {
		const obj: any = {};
		row.forEach((cell: any, i: number) => {
			obj[columns[i]] = cell.value;
		});
		return obj;
	});

	return { rows };
};

const handlePublicReport = async (request: Request, env: Env) => {
	const { pathname } = new URL(request.url);
	const shareToken = pathname.split('/api/report/')[1];
	if (!shareToken) return json(request, { error: 'Missing share token.' }, 400);

	try {
		const result = await queryTurso(env, 'SELECT * FROM shared_reports WHERE share_token = ?', [shareToken]);
		if (result.rows.length === 0) return json(request, { error: 'Report not found.' }, 404);

		const report = result.rows[0];
		if (!report.is_active) return json(request, { error: 'Report is revoked.' }, 403);
		if (report.expires_at && new Date(report.expires_at) < new Date()) {
			return json(request, { error: 'Report expired.' }, 410);
		}

		// Increment view count
		await queryTurso(env, 'UPDATE shared_reports SET view_count = view_count + 1 WHERE id = ?', [report.id]);

		return json(request, { report });
	} catch (error: any) {
		return json(request, { error: error.message }, 500);
	}
};

const patchClerkMetadata = async (
	env: Env,
	userId: string,
	metadata: {
		subscription_status?: string;
		stripe_customer_id?: string;
		stripe_subscription_id?: string;
		stripe_price_id?: string;
	}
) => {
	if (!env.CLERK_SECRET_KEY || !userId) return;

	await fetch(`${getClerkApiUrl(env)}/v1/users/${userId}/metadata`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			private_metadata: {
				subscription_status: metadata.subscription_status,
				stripe_customer_id: metadata.stripe_customer_id,
				stripe_subscription_id: metadata.stripe_subscription_id,
				stripe_price_id: metadata.stripe_price_id
			}
		})
	});
};

const verifyStripeSignature = async (request: Request, env: Env, rawBody: string) => {
	if (!env.STRIPE_WEBHOOK_SECRET) {
		throw new Error('Stripe webhook secret is not configured.');
	}

	const signatureHeader = request.headers.get('Stripe-Signature') || '';
	const elements = Object.fromEntries(
		signatureHeader
			.split(',')
			.map((part) => part.trim().split('='))
			.filter((entry) => entry.length === 2)
	);

	const timestamp = elements.t;
	const signature = elements.v1;
	if (!timestamp || !signature) {
		throw new Error('Missing Stripe signature headers.');
	}

	const signedPayload = `${timestamp}.${rawBody}`;
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(env.STRIPE_WEBHOOK_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
	const expected = toHex(digest);

	if (!timingSafeEqual(expected, signature)) {
		throw new Error('Invalid Stripe signature.');
	}
};

const stripeForm = async (
	env: Env,
	path: string,
	params: URLSearchParams
) => {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in the Worker.');
	}

	const response = await fetch(`https://api.stripe.com${path}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params.toString()
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const message = typeof payload?.error?.message === 'string'
			? payload.error.message
			: 'Stripe request failed.';
		throw new Error(message);
	}

	return payload;
};

const findStripeCustomerId = async (env: Env, email?: string, providedId?: string) => {
	if (providedId) return providedId;
	if (!email) {
		throw new Error('No Stripe customer was found for this account.');
	}

	const params = new URLSearchParams();
	params.set('email', email);
	params.set('limit', '1');
	const payload = await stripeForm(env, '/v1/customers/search', new URLSearchParams({
		query: `email:'${email.replace(/'/g, "\\'")}'`,
		limit: '1'
	})).catch(async () => {
		const fallback = await fetch(`https://api.stripe.com/v1/customers?${params.toString()}`, {
			headers: {
				Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
			}
		});
		const fallbackPayload = await fallback.json().catch(() => ({}));
		if (!fallback.ok) {
			throw new Error('Unable to look up Stripe customer.');
		}
		return fallbackPayload;
	});

	const customerId = payload?.data?.[0]?.id;
	if (!customerId) {
		throw new Error('No Stripe customer was found for this account.');
	}
	return customerId;
};

const handleCheckout = async (request: Request, env: Env) => {
	const auth = await verifyClerkToken(request, env);
	const body = await request.json() as BillingCheckoutBody;
	if (!body.priceId || !body.successUrl || !body.cancelUrl) {
		return json(request, { error: 'Missing checkout configuration.' }, 400);
	}
	if (body.clerkUserId && body.clerkUserId !== auth.userId) {
		return json(request, { error: 'Authenticated Clerk user does not match request body.' }, 403);
	}

	const params = new URLSearchParams();
	params.set('mode', 'subscription');
	params.set('success_url', body.successUrl);
	params.set('cancel_url', body.cancelUrl);
	params.set('allow_promotion_codes', 'true');
	params.set('billing_address_collection', 'auto');
	params.set('line_items[0][price]', body.priceId);
	params.set('line_items[0][quantity]', '1');
	params.set('subscription_data[metadata][tier_name]', body.tierName || body.priceId);
	if (body.clerkUserId) {
		params.set('client_reference_id', body.clerkUserId);
		params.set('subscription_data[metadata][clerk_user_id]', body.clerkUserId);
	}
	if (body.email) {
		params.set('customer_email', body.email);
		params.set('subscription_data[metadata][customer_email]', body.email);
	}

	const trialDays = Number(env.STRIPE_TRIAL_DAYS || '14');
	if (Number.isFinite(trialDays) && trialDays > 0) {
		params.set('subscription_data[trial_period_days]', String(trialDays));
	}

	const payload = await stripeForm(env, '/v1/checkout/sessions', params);
	return json(request, { url: payload.url });
};

const handlePortal = async (request: Request, env: Env) => {
	const auth = await verifyClerkToken(request, env);
	const body = await request.json() as BillingPortalBody;
	if (body.clerkUserId && body.clerkUserId !== auth.userId) {
		return json(request, { error: 'Authenticated Clerk user does not match request body.' }, 403);
	}
	const customerId = await findStripeCustomerId(env, body.email, body.stripeCustomerId);

	const params = new URLSearchParams();
	params.set('customer', customerId);
	params.set('return_url', body.returnUrl || new URL(request.url).origin);

	const payload = await stripeForm(env, '/v1/billing_portal/sessions', params);
	return json(request, { url: payload.url });
};

const handleStripeWebhook = async (request: Request, env: Env) => {
	const rawBody = await request.text();
	await verifyStripeSignature(request, env, rawBody);

	const event = JSON.parse(rawBody);
	const eventType = String(event?.type || '');
	const object = event?.data?.object || {};
	const metadata = object?.metadata || {};
	const userId = metadata?.clerk_user_id || object?.client_reference_id;

	if (!userId) {
		return json(request, { ok: true, skipped: true });
	}

	if (eventType === 'checkout.session.completed') {
		await patchClerkMetadata(env, userId, {
			subscription_status: object?.payment_status === 'paid' ? 'active' : 'trialing',
			stripe_customer_id: object?.customer || '',
			stripe_subscription_id: object?.subscription || '',
			stripe_price_id: object?.metadata?.price_id || ''
		});
	}

	if (eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') {
		const item = object?.items?.data?.[0];
		await patchClerkMetadata(env, userId, {
			subscription_status: object?.status || 'active',
			stripe_customer_id: object?.customer || '',
			stripe_subscription_id: object?.id || '',
			stripe_price_id: item?.price?.id || ''
		});
	}

	if (eventType === 'customer.subscription.deleted') {
		await patchClerkMetadata(env, userId, {
			subscription_status: 'free',
			stripe_customer_id: object?.customer || '',
			stripe_subscription_id: object?.id || '',
			stripe_price_id: ''
		});
	}

	return json(request, { ok: true });
};

const handleGhostBridge = async (request: Request) => {
	const targetUrl = new URL(request.url).searchParams.get('url');
	if (!targetUrl) {
		return new Response("Missing 'url' parameter", { status: 400 });
	}

	const targetResponse = await fetch(targetUrl, {
		headers: {
			'User-Agent': request.headers.get('User-Agent') || 'Headlight-Ghost/1.0',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5'
		},
		redirect: 'follow'
	});

	const responseHeaders = new Headers(targetResponse.headers);
	responseHeaders.set('Access-Control-Allow-Origin', '*');
	responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	responseHeaders.set('Access-Control-Allow-Headers', '*');

	return new Response(targetResponse.body, {
		status: targetResponse.status,
		statusText: targetResponse.statusText,
		headers: responseHeaders
	});
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return json(request, { ok: true });
		}

		const { pathname } = new URL(request.url);

		try {
			if (pathname === '/api/health') {
				return json(request, { ok: true });
			}

			if (pathname === '/api/billing/checkout' && request.method === 'POST') {
				return await handleCheckout(request, env);
			}

			if (pathname === '/api/billing/portal' && request.method === 'POST') {
				return await handlePortal(request, env);
			}

			if (pathname === '/api/webhooks/stripe' && request.method === 'POST') {
				return await handleStripeWebhook(request, env);
			}

			if (pathname.startsWith('/api/report/') && request.method === 'GET') {
				return await handlePublicReport(request, env);
			}

			return await handleGhostBridge(request);
		} catch (error: any) {
			if (pathname.startsWith('/api/')) {
				return json(request, { error: error?.message || 'Worker request failed.' }, 500);
			}
			return new Response(`Bridge Error: ${error?.message || 'Unknown error'}`, { status: 500 });
		}
	}
};
