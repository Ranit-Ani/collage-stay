import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/endpoints";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setSent(true);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-xl font-semibold text-ink-900 text-center mb-1">Forgot Password</h1>
        <p className="text-sm text-ink-500 text-center mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <p className="text-sm text-center text-ink-600">
            If an account exists with <strong>{email}</strong>, a reset link has been sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-sm text-ink-500 text-center mt-6">
          <Link to="/login" className="text-brand-600 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
