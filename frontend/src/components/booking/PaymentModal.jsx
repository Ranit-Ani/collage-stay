import React, { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, Banknote, ShieldCheck } from "lucide-react";
import Modal from "../common/Modal";
import { bookingApi } from "../../api/endpoints";

/**
 * Handles the student's side of the security deposit payment step:
 *   - choose Online or Offline
 *   - Online: simulate a payment attempt against the sandbox gateway stub
 *     (see backend/src/services/paymentService.js — swap for real
 *     Razorpay/Stripe checkout there without changing this component's API)
 *   - Offline: submit a note describing how/when they paid, then wait for
 *     the owner to verify it
 */
const PaymentModal = ({ booking, open, onClose, onUpdated }) => {
  const [method, setMethod] = useState(null); // "Online" | "Offline" | null
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!booking) return null;
  const { payment } = booking;
  const amount = payment?.amount || 0;

  const handleClose = () => {
    setMethod(null);
    setNote("");
    onClose();
  };

  const handlePayOnline = async (simulateSuccess) => {
    setBusy(true);
    try {
      await bookingApi.initiateOnlinePayment(booking._id);
      const { data } = await bookingApi.verifyOnlinePayment(booking._id, { success: simulateSuccess });
      if (simulateSuccess) {
        toast.success("Payment successful — booking confirmed!");
        handleClose();
      } else {
        toast.error("Payment failed. You can try again.");
      }
      onUpdated?.(data.data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitOffline = async () => {
    if (!note.trim()) return toast.error("Please describe how you paid.");
    setBusy(true);
    try {
      const { data } = await bookingApi.submitOfflinePayment(booking._id, note.trim());
      toast.success("Submitted — waiting for the owner to verify.");
      onUpdated?.(data.data.booking);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  const renderBody = () => {
    if (payment?.status === "Awaiting Verification") {
      return (
        <div className="text-sm text-ink-600 space-y-2">
          <p>Your offline payment is awaiting verification by the owner.</p>
          {payment.offlineNote && (
            <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">"{payment.offlineNote}"</div>
          )}
        </div>
      );
    }

    if (!method) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            Pay the <strong>₹{amount.toLocaleString()}</strong> security deposit to confirm your booking.
          </p>
          {payment?.status === "Failed" && payment?.rejectionReason && (
            <div className="rounded-lg bg-red-50 text-red-700 text-xs p-3">{payment.rejectionReason}</div>
          )}
          <button
            onClick={() => setMethod("Online")}
            className="w-full flex items-center gap-3 rounded-lg border border-ink-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
          >
            <CreditCard className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink-900">Pay Online</p>
              <p className="text-xs text-ink-500">Instant confirmation on successful payment</p>
            </div>
          </button>
          <button
            onClick={() => setMethod("Offline")}
            className="w-full flex items-center gap-3 rounded-lg border border-ink-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
          >
            <Banknote className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink-900">Pay Offline</p>
              <p className="text-xs text-ink-500">Cash, UPI, or bank transfer — verified by the owner</p>
            </div>
          </button>
        </div>
      );
    }

    if (method === "Online") {
      return (
        <div className="space-y-4">
          <div className="rounded-lg bg-ink-50 p-4 flex items-center justify-between">
            <span className="text-sm text-ink-600">Amount</span>
            <span className="text-lg font-semibold text-ink-900">₹{amount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-ink-400">
            Sandbox mode — no real gateway is connected yet. Simulate a successful or failed payment below.
          </p>
          <button onClick={() => handlePayOnline(true)} disabled={busy} className="btn-primary w-full">
            {busy ? "Processing..." : `Pay ₹${amount.toLocaleString()} Now`}
          </button>
          <button onClick={() => handlePayOnline(false)} disabled={busy} className="text-xs text-ink-400 hover:text-ink-600 underline w-full text-center">
            Simulate a failed payment
          </button>
          <button onClick={() => setMethod(null)} className="text-xs text-brand-600 w-full text-center">
            Choose a different payment method
          </button>
        </div>
      );
    }

    // Offline
    return (
      <div className="space-y-3">
        <label className="label">How did you pay?</label>
        <textarea
          className="input min-h-[100px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Paid ₹5,000 via UPI to the owner on 5 Aug, ref no. 123456789"
        />
        <button onClick={handleSubmitOffline} disabled={busy} className="btn-primary w-full">
          {busy ? "Submitting..." : "I Have Paid Offline"}
        </button>
        <button onClick={() => setMethod(null)} className="text-xs text-brand-600 w-full text-center">
          Choose a different payment method
        </button>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Security Deposit Payment">
      <div className="flex items-center gap-2 text-xs text-ink-400 mb-4">
        <ShieldCheck className="h-4 w-4" /> Your deposit is held against this booking only.
      </div>
      {renderBody()}
    </Modal>
  );
};

export default PaymentModal;
