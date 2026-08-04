import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Home } from "lucide-react";
import { authApi } from "../../api/endpoints";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success("Account created. Enter the code we emailed you to verify your account.");
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) setErrors(apiErrors.map((e) => e.message));
      else toast.error(err.response?.data?.message || "Registration failed");
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

        <h1 className="text-xl font-semibold text-ink-900 text-center mb-1">Create your account</h1>
        <p className="text-sm text-ink-500 text-center mb-6">
          Find or list rooms, PGs, flats, and mess services.
        </p>

        {errors.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700 space-y-1">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {["student", "homeowner"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => update("role", r)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                    form.role === r
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600"
                  }`}
                >
                  {r === "homeowner" ? "Home Owner" : "Student"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              required
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
