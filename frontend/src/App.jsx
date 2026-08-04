import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import FavouritesPage from "./pages/student/FavouritesPage";
import BookingHistoryPage from "./pages/student/BookingHistoryPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";

import OwnerDashboard from "./pages/homeowner/OwnerDashboard";
import MyPropertiesPage from "./pages/homeowner/MyPropertiesPage";
import AddPropertyPage from "./pages/homeowner/AddPropertyPage";
import EditPropertyPage from "./pages/homeowner/EditPropertyPage";
import OwnerBookingRequestsPage from "./pages/homeowner/OwnerBookingRequestsPage";
import OwnerProfilePage from "./pages/homeowner/OwnerProfilePage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudentsPage from "./pages/admin/ManageStudentsPage";
import ManageHomeOwnersPage from "./pages/admin/ManageHomeOwnersPage";
import ManageListingsPage from "./pages/admin/ManageListingsPage";
import ManageReviewsPage from "./pages/admin/ManageReviewsPage";

import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/properties/:id" element={<PropertyDetailsPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Student */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/favourites" element={
        <ProtectedRoute roles={["student"]}><FavouritesPage /></ProtectedRoute>
      } />
      <Route path="/student/bookings" element={
        <ProtectedRoute roles={["student"]}><BookingHistoryPage /></ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute roles={["student"]}><StudentProfilePage /></ProtectedRoute>
      } />

      {/* Home Owner */}
      <Route path="/owner/dashboard" element={
        <ProtectedRoute roles={["homeowner"]}><OwnerDashboard /></ProtectedRoute>
      } />
      <Route path="/owner/properties" element={
        <ProtectedRoute roles={["homeowner"]}><MyPropertiesPage /></ProtectedRoute>
      } />
      <Route path="/owner/properties/new" element={
        <ProtectedRoute roles={["homeowner"]}><AddPropertyPage /></ProtectedRoute>
      } />
      <Route path="/owner/properties/:id/edit" element={
        <ProtectedRoute roles={["homeowner"]}><EditPropertyPage /></ProtectedRoute>
      } />
      <Route path="/owner/bookings" element={
        <ProtectedRoute roles={["homeowner"]}><OwnerBookingRequestsPage /></ProtectedRoute>
      } />
      <Route path="/owner/profile" element={
        <ProtectedRoute roles={["homeowner"]}><OwnerProfilePage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute roles={["admin"]}><ManageStudentsPage /></ProtectedRoute>
      } />
      <Route path="/admin/home-owners" element={
        <ProtectedRoute roles={["admin"]}><ManageHomeOwnersPage /></ProtectedRoute>
      } />
      <Route path="/admin/listings" element={
        <ProtectedRoute roles={["admin"]}><ManageListingsPage /></ProtectedRoute>
      } />
      <Route path="/admin/reviews" element={
        <ProtectedRoute roles={["admin"]}><ManageReviewsPage /></ProtectedRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
