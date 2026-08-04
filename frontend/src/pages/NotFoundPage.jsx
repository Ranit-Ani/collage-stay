import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-4 text-center">
    <p className="text-5xl font-semibold text-ink-900 mb-2">404</p>
    <p className="text-ink-500 mb-6">This page doesn't exist.</p>
    <Link to="/" className="btn-primary">Back to Home</Link>
  </div>
);

export default NotFoundPage;
