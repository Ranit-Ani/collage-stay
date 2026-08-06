import api from "./axios";

// ---------- Auth ----------
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data), // { email, otp }
  resendVerification: (email) => api.post("/auth/resend-verification", { email }),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

// ---------- Properties ----------
export const propertyApi = {
  search: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getMine: () => api.get("/properties/mine"),
  create: (formData) =>
    api.post("/properties", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => api.put(`/properties/${id}`, data),
  updateAvailability: (id, data) => api.patch(`/properties/${id}/availability`, data),
  addImages: (id, formData) =>
    api.post(`/properties/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (id, publicId) =>
    api.delete(`/properties/${id}/images/${encodeURIComponent(publicId)}`),
  remove: (id) => api.delete(`/properties/${id}`),
};

// ---------- Students ----------
export const studentApi = {
  updateProfile: (data) => api.put("/students/profile", data),
  uploadProfilePicture: (formData) =>
    api.post("/students/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getFavourites: () => api.get("/students/favourites"),
  addFavourite: (propertyId) => api.post(`/students/favourites/${propertyId}`),
  removeFavourite: (propertyId) => api.delete(`/students/favourites/${propertyId}`),
  getBookingHistory: () => api.get("/students/bookings"),
};

// ---------- Home Owners ----------
export const homeOwnerApi = {
  updateProfile: (data) => api.put("/home-owners/profile", data),
  uploadProfilePicture: (formData) =>
    api.post("/home-owners/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDashboardStats: () => api.get("/home-owners/dashboard-stats"),
};

// ---------- Bookings ----------
export const bookingApi = {
  create: (data) => api.post("/bookings", data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  cancelByOwner: (id, reason) => api.patch(`/bookings/${id}/cancel-by-owner`, { reason }),
  getOwnerRequests: (status) => api.get("/bookings/owner", { params: { status } }),
  getById: (id) => api.get(`/bookings/${id}`),
  accept: (id) => api.patch(`/bookings/${id}/accept`),
  reject: (id, reason) => api.patch(`/bookings/${id}/reject`, { reason }),

  // Security deposit payment
  initiateOnlinePayment: (id) => api.post(`/bookings/${id}/payment/online/initiate`),
  verifyOnlinePayment: (id, data) => api.post(`/bookings/${id}/payment/online/verify`, data),
  submitOfflinePayment: (id, note) => api.post(`/bookings/${id}/payment/offline/submit`, { note }),
  verifyOfflinePayment: (id, data) => api.patch(`/bookings/${id}/payment/offline/verify`, data),

  // Move-in
  confirmMoveIn: (id) => api.patch(`/bookings/${id}/movein/confirm`),

  // Vacate
  requestVacate: (id, reason) => api.patch(`/bookings/${id}/vacate/request`, { reason }),
  approveVacate: (id) => api.patch(`/bookings/${id}/vacate/approve`),
  rejectVacate: (id, reason) => api.patch(`/bookings/${id}/vacate/reject`, { reason }),
};

// ---------- Reviews ----------
export const reviewApi = {
  getForProperty: (propertyId) => api.get(`/reviews/${propertyId}`),
  create: (propertyId, data) => api.post(`/reviews/${propertyId}`, data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  remove: (id) => api.delete(`/reviews/${id}`),
};

// ---------- Notifications ----------
export const notificationApi = {
  getMine: () => api.get("/notifications"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// ---------- Admin ----------
export const adminApi = {
  getDashboardStats: () => api.get("/admin/dashboard-stats"),
  getStudents: () => api.get("/admin/students"),
  getHomeOwners: () => api.get("/admin/home-owners"),
  toggleBlockUser: (id) => api.patch(`/admin/users/${id}/toggle-block`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPendingProperties: () => api.get("/admin/properties/pending"),
  approveProperty: (id) => api.patch(`/admin/properties/${id}/approve`),
  rejectProperty: (id, reason) => api.patch(`/admin/properties/${id}/reject`, { reason }),
  deleteProperty: (id) => api.delete(`/admin/properties/${id}`),
  getAllReviews: () => api.get("/admin/reviews"),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};
