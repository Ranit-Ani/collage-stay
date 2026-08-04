import React from "react";
import { Link, Navigate } from "react-router-dom";
import { Search, ShieldCheck, Bell, Building2, ArrowRight, MapPin, Star } from "lucide-react";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";

const roleHome = {
  student: "/student/dashboard",
  homeowner: "/owner/dashboard",
  admin: "/admin/dashboard",
};

const HomePage = () => {
  const { user, loading } = useAuth();

  // Logged-in visitors land straight in their dashboard instead of the
  // public marketing page — the landing page is only for signed-out visitors.
  if (!loading && user) {
    return <Navigate to={roleHome[user.role] || "/"} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-grid" style={{ backgroundSize: "22px 22px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20 text-center">
          <span className="badge bg-white text-brand-700 border border-brand-100 shadow-soft mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 mr-1.5" />
            Built for newly admitted students
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold text-ink-900 tracking-tight max-w-3xl mx-auto leading-[1.1]">
            Find your room, PG, or mess —{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              near your college
            </span>
          </h1>
          <p className="mt-5 text-base text-ink-500 max-w-xl mx-auto leading-relaxed">
            CollegeStay connects students with verified home owners. Search, compare, and send a
            booking request in minutes — no calls, no middlemen.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/search" className="btn-primary !px-6 !py-3">
              <Search className="h-4 w-4" /> Search Accommodation
            </Link>
            <Link to="/register" className="btn-secondary !px-6 !py-3">
              List Your Property <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-16 grid grid-cols-3 max-w-md mx-auto gap-4 pt-8 border-t border-ink-100">
            <div>
              <p className="text-2xl font-semibold text-ink-900">8+</p>
              <p className="text-xs text-ink-500 mt-0.5">Property types</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-900">Live</p>
              <p className="text-xs text-ink-500 mt-0.5">Seat availability</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-900">Verified</p>
              <p className="text-xs text-ink-500 mt-0.5">Admin-approved only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <p className="section-title text-center">Why CollegeStay</p>
        <h2 className="text-2xl font-semibold text-ink-900 text-center mb-12">
          Everything you need, in one search
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: "Verified Listings",
              desc: "Every property is reviewed and approved by our admin team before it goes live.",
            },
            {
              icon: Bell,
              title: "Real-Time Updates",
              desc: "Get instant notifications the moment your booking request is accepted or rejected.",
            },
            {
              icon: Building2,
              title: "Every Option Covered",
              desc: "Hostels, PGs, shared rooms, flats, apartments, and mess services in one search.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-card transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 shadow-sm">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-ink-900 mb-1.5">{title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-ink-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Own a property near a college?
          </h2>
          <p className="mt-3 text-ink-300 max-w-lg mx-auto">
            List your rooms, PG, or mess service and start receiving booking requests from
            verified students today.
          </p>
          <Link to="/register" className="btn-primary !bg-white !text-ink-900 hover:!bg-ink-100 mt-7 inline-flex">
            <MapPin className="h-4 w-4" /> List Your Property
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
          <span>© {new Date().getFullYear()} CollegeStay. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Made for students, by students.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
