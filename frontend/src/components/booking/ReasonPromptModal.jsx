import React, { useState } from "react";
import Modal from "../common/Modal";

/**
 * Reusable confirm-with-reason dialog, used for rejecting a request,
 * cancelling a booking, or deciding a vacate request.
 */
const ReasonPromptModal = ({
  open,
  onClose,
  title,
  label = "Reason",
  placeholder = "",
  required = false,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (required && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (required && !reason.trim())}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {submitting ? "Submitting..." : confirmLabel}
          </button>
        </>
      }
    >
      <label className="label">{label} {!required && <span className="normal-case font-normal text-ink-400">(optional)</span>}</label>
      <textarea
        className="input min-h-[100px]"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={placeholder}
      />
    </Modal>
  );
};

export default ReasonPromptModal;
