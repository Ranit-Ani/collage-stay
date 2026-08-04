import React from "react";
import { Link } from "react-router-dom";
import { Search, ShieldCheck, Bell, Building2 } from "lucide-react";
import Navbar from "../components/common/Navbar";

const HomePage = () => (
  <div className="min-h-screen bg-white">
    <Navbar />

    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
      <span className="badge bg-brand-50 text-brand-700 mb-4">For newly admitted students</span>
      <h1 className="text-3xl sm:text-5xl font-semibold text-ink-900 tracking-tight max-w-3xl mx-auto">
        Find rooms, PGs, and mess options near your college — all in one place
      </h1>
      <p className="mt-4 text-ink-500 max-w-xl mx-auto">
        CollegeStay connects students with verified home owners. Search, compare, and request
        accommodation without the back-and-forth.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link to="/search" className="btn-primary">
          <Search className="h-4 w-4" /> Search Accommodation
        </Link>
        <Link to="/register" className="btn-secondary">List Your Property</Link>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
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
        <div key={title} className="card p-6">
          <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
            <Icon className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="font-semibold text-ink-900 mb-1">{title}</h3>
          <p className="text-sm text-ink-500">{desc}</p>
        </div>
      ))}
    </section>
  </div>
);

export default HomePage;
