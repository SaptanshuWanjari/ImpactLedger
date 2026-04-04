import crypto from "node:crypto";

export type RazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function getRazorpayConfig() {
  return {
    keyId: getRequiredEnv("RAZORPAY_KEY_ID"),
    keySecret: getRequiredEnv("RAZORPAY_KEY_SECRET"),
  };
}

export function getRazorpayWebhookSecret() {
  return getRequiredEnv("RAZORPAY_WEBHOOK_SECRET");
}

export function getAppUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_URL");
}

export async function createRazorpayOrder(input: {
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { keyId, keySecret } = getRazorpayConfig();

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes || {},
    }),
  });

  const payload = (await response.json().catch(() => null)) as RazorpayOrderResponse | { error?: { description?: string } } | null;

  if (!response.ok || !payload || !("id" in payload)) {
    const message =
      (payload && "error" in payload && payload.error?.description) ||
      `Razorpay order creation failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(signature, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}
