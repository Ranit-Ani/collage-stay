import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "../../api/endpoints";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-ink-600">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-ink-900 mb-1">Email Verified</h1>
            <p className="text-sm text-ink-500 mb-6">{message}</p>
            <Link to="/login" className="btn-primary">Go to Login</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-ink-900 mb-1">Verification Failed</h1>
            <p className="text-sm text-ink-500 mb-6">{message}</p>
            <Link to="/register" className="btn-secondary">Back to Sign Up</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
