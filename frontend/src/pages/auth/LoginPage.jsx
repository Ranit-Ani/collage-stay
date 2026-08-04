import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const roleHome = {
  student: "/student/dashboard",
  homeowner: "/owner/dashboard",
  admin: "/admin/dashboard",
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      const redirectTo = location.state?.from?.pathname || roleHome[user.role] || "/";
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      toast.error(message);
      if (message.toLowerCase().includes("verify")) {
        navigate("/verify-otp", { state: { email: form.email } });
      }
    } finally {
      setLoading(false);
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

        <h1 className="text-xl font-semibold text-ink-900 text-center mb-1">Welcome back</h1>
        <p className="text-sm text-ink-500 text-center mb-6">Log in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label !mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-600 font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="input"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
