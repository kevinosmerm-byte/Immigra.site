import Stripe from "stripe";
import { PRO_PLAN } from "../shared/featureAccessConfig.js";
import { applyVerifiedEntitlementEvent, getBillingIdentity } from "./accountService.js";

const PRICE_KEYS = Object.freeze({
  monthly: "STRIPE_PRICE_MONTHLY",
  annual: "STRIPE_PRICE_ANNUAL",
});

let stripeClient;

function isTrue(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Stripe is not configured.");
  if (!stripeClient) stripeClient = new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 20_000 });
  return stripeClient;
}

function priceIdForInterval(interval) {
  const environmentKey = PRICE_KEYS[interval];
  return environmentKey ? process.env[environmentKey]?.trim() || "" : "";
}

function appBaseUrl() {
  const configured = process.env.APP_BASE_URL?.trim() || "https://citizenshipai.us";
  try {
    const url = new URL(configured);
    if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid protocol");
    return url.origin;
  } catch {
    return "https://citizenshipai.us";
  }
}

export function getBillingConfiguration() {
  const configured = Boolean(
    process.env.STRIPE_SECRET_KEY?.trim()
    && process.env.STRIPE_WEBHOOK_SECRET?.trim()
    && priceIdForInterval("monthly")
    && priceIdForInterval("annual")
  );
  return {
    provider: "stripe",
    enabled: configured && isTrue(process.env.STRIPE_BILLING_ENABLED),
    configured,
    currency: PRO_PLAN.currency,
    monthlyPriceCents: PRO_PLAN.regularMonthlyPriceCents,
    monthlyTrialDays: 0,
    annualPriceCents: PRO_PLAN.annualPriceCents,
    introductoryOfferEnabled: false,
  };
}

export function mapStripeSubscription(subscription) {
  const providerStatus = subscription?.status || "incomplete";
  const active = providerStatus === "active" || providerStatus === "trialing";
  const grace = providerStatus === "past_due";
  const periods = Array.isArray(subscription?.items?.data)
    ? subscription.items.data.flatMap((item) => [item?.current_period_start, item?.current_period_end]).filter(Number.isFinite)
    : [];
  const directStart = Number.isFinite(subscription?.current_period_start) ? subscription.current_period_start : null;
  const directEnd = Number.isFinite(subscription?.current_period_end) ? subscription.current_period_end : null;
  const periodStartSeconds = directStart ?? (periods.length ? Math.min(...periods) : null);
  const periodEndSeconds = directEnd ?? (periods.length ? Math.max(...periods) : null);
  return {
    tier: active || grace ? "pro" : "free",
    status: active ? "active" : grace ? "grace" : providerStatus === "canceled" ? "revoked" : "expired",
    periodStart: periodStartSeconds ? new Date(periodStartSeconds * 1000).toISOString() : null,
    periodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
  };
}

export function subscriptionDataForInterval(interval, metadata) {
  if (!["monthly", "annual"].includes(interval)) throw new Error("Unknown billing interval.");
  return {
    metadata,

  };
}

export async function createCheckoutSession({ userId, email, interval }) {
  const billing = getBillingConfiguration();
  if (!billing.enabled) throw new Error("Billing is not enabled.");
  const price = priceIdForInterval(interval);
  if (!price) throw new Error("Unknown billing interval.");

  const identity = await getBillingIdentity(userId);
  if (identity?.tier === "pro" && ["active", "grace"].includes(identity.status)) {
    const error = new Error("A Pro subscription is already active.");
    error.code = "subscription_already_active";
    throw error;
  }

  const baseUrl = appBaseUrl();
  const customer = identity?.provider === "stripe" ? identity.providerCustomerId : null;
  // Fail closed if deployment points at an old introductory or incorrect price.
  const configuredPrice = await getStripe().prices.retrieve(price);
  const expectedAmount = interval === "monthly" ? PRO_PLAN.regularMonthlyPriceCents : PRO_PLAN.annualPriceCents;
  if (!configuredPrice.active || configuredPrice.currency !== "usd"
      || configuredPrice.unit_amount !== expectedAmount
      || configuredPrice.recurring?.interval !== (interval === "monthly" ? "month" : "year")
      || configuredPrice.recurring?.interval_count !== 1) {
    throw new Error("The configured subscription price does not match the advertised plan.");
  }
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: userId,
    ...(customer ? { customer } : { customer_email: email || undefined }),
    metadata: { user_id: userId, product_key: PRO_PLAN.productKey, interval },
    subscription_data: subscriptionDataForInterval(interval, { user_id: userId, product_key: PRO_PLAN.productKey, interval }),
    payment_method_collection: "always",
    allow_promotion_codes: true,
    automatic_tax: { enabled: isTrue(process.env.STRIPE_AUTOMATIC_TAX) },
    success_url: `${baseUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?billing=cancelled`,
  });
  return { url: session.url };
}

export async function createPortalSession({ userId }) {
  const billing = getBillingConfiguration();
  if (!billing.enabled) throw new Error("Billing is not enabled.");
  const identity = await getBillingIdentity(userId);
  if (identity?.provider !== "stripe" || !identity.providerCustomerId) {
    const error = new Error("No Stripe subscription was found for this account.");
    error.code = "stripe_customer_not_found";
    throw error;
  }
  const session = await getStripe().billingPortal.sessions.create({
    customer: identity.providerCustomerId,
    return_url: `${appBaseUrl()}/`,
  });
  return { url: session.url };
}

export async function applyStripeEvent(event) {
  if (!["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    return { received: true, handled: false };
  }

  const subscription = event.data.object;
  const userId = subscription?.metadata?.user_id;
  // Stripe's dashboard fixtures and subscriptions created outside this app do
  // not carry our account metadata. They are valid signed events, but they must
  // not create entitlements or trigger repeated webhook retries.
  if (!userId) return { received: true, handled: false, reason: "missing_account_identity" };
  const mapped = mapStripeSubscription(subscription);
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const result = await applyVerifiedEntitlementEvent({
    provider: "stripe",
    providerEventId: event.id,
    userId,
    eventType: event.type,
    tier: mapped.tier,
    status: mapped.status,
    providerCustomerId: customerId || null,
    providerEntitlementId: subscription.id,
    periodStart: mapped.periodStart,
    periodEnd: mapped.periodEnd,
    occurredAt: new Date(event.created * 1000).toISOString(),
  });
  return { received: true, handled: true, applied: result?.applied === true, duplicate: result?.duplicate === true };
}

export async function handleStripeWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) throw new Error("Stripe webhook signing is not configured.");
  const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  return applyStripeEvent(event);
}
