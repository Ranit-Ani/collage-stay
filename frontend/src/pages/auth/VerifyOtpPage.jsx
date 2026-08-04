import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Home, MailCheck } from "lucide-react";
import { authApi } from "../../api/endpoints";

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(pasted.padEnd(6, " ").split("").map((c) => (c === " " ? "" : c)));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    if (!email) {
      toast.error("Enter the email you registered with");
      return;
    }
    setVerifying(true);
    try {
      const { data } = await authApi.verifyEmail({ email, otp });
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Enter the email you registered with first");
      return;
    }
    setResending(true);
    try {
      const { data } = await authApi.resendVerification(email);
      toast.success(data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-ink-900">CollegeStay</span>
        </div>

        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center">
            <MailCheck className="h-6 w-6 text-brand-600" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-ink-900 text-center mb-1">Verify your email</h1>
        <p className="text-sm text-ink-500 text-center mb-6">
          Enter the 6-digit code we sent to your email. It expires in 10 minutes.
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          {!location.state?.email && (
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          )}

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-11 sm:w-12 text-center text-lg font-semibold rounded-lg border border-ink-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            ))}
          </div>

          <button type="submit" disabled={verifying} className="btn-primary w-full">
            {verifying ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-ink-500">
          Didn't get a code?{" "}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-brand-600 font-medium disabled:text-ink-400"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
          </button>
        </div>

        <p className="text-sm text-ink-500 text-center mt-4">
          <Link to="/login" className="text-brand-600 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
