const crypto = require("crypto");

/**
 * Thin abstraction over a payment gateway. There's no real gateway wired up
 * yet, so this is a self-contained sandbox implementation — but the booking
 * controller only ever talks to `createOrder` / `verifyPayment`, so swapping
 * these two functions for real Razorpay (`razorpay.orders.create`, signature
 * verification) or Stripe (`stripe.paymentIntents.create`, webhook handling)
 * calls later won't require touching the booking model, controller, or
 * frontend beyond the checkout widget itself.
 */

// @desc Create a payment order for a booking's security deposit.
const createOrder = async ({ bookingId, amount, currency = "INR" }) => {
  return {
    orderId: `order_${crypto.randomBytes(8).toString("hex")}`,
    amount,
    currency,
    bookingId: bookingId.toString(),
    // Sandbox mode: no real gateway checkout — the client simulates a result
    // and calls the verify endpoint directly. A real integration would
    // instead redirect to the gateway's checkout and verify a signed
    // callback/webhook here.
    mode: "sandbox",
  };
};

// @desc Verify a payment result reported by the client.
// A real integration would validate a Razorpay signature (order_id +
// payment_id + secret) or fetch the Stripe PaymentIntent status instead of
// trusting the client-reported `success` flag.
const verifyPayment = async ({ transactionId, success }) => {
  return {
    verified: !!success,
    transactionId: transactionId?.trim() || `txn_${crypto.randomBytes(8).toString("hex")}`,
  };
};

module.exports = { createOrder, verifyPayment };
