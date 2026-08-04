# CollegeStay — College Room & Mess Availability Platform

A full-stack MERN application connecting newly admitted students with verified
home owners for rooms, hostels, PGs, flats, and mess services.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Socket.IO Client, Google Maps
- **Backend:** Node.js, Express.js, MVC architecture, Socket.IO
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** JWT in httpOnly cookies, bcrypt password hashing, mandatory email verification
- **Email:** Brevo SMTP via Nodemailer
- **Images:** Cloudinary
- **Deployment:** Render (frontend + backend), MongoDB Atlas (database)

## Folder Structure

```
college-stay/
├── backend/
│   ├── server.js                # entry point (HTTP + Socket.IO)
│   ├── src/
│   │   ├── app.js               # Express app, middleware, route mounting
│   │   ├── config/               # db.js, cloudinary.js, socket.js
│   │   ├── models/                # User, Property, BookingRequest, Review, Notification
│   │   ├── controllers/           # business logic per resource
│   │   ├── routes/                # REST route definitions
│   │   ├── middlewares/           # auth, role, error, validation, upload, rate limiting
│   │   ├── validators/            # express-validator rule sets
│   │   └── utils/                 # JWT helper, email sender + templates, response helper, admin seed script
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # axios instance + grouped endpoint calls
│   │   ├── context/                # AuthContext, SocketContext
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Sidebar, DashboardLayout, ProtectedRoute, Loader, Modal, RatingStars, StatusBadge
│   │   │   └── property/            # PropertyCard, SearchFilters
│   │   ├── pages/
│   │   │   ├── auth/                # Register, Login, VerifyEmail, ForgotPassword, ResetPassword
│   │   │   ├── student/             # Dashboard, Favourites, BookingHistory, Profile
│   │   │   ├── homeowner/           # Dashboard, MyProperties, AddProperty, EditProperty, BookingRequests, Profile
│   │   │   └── admin/               # Dashboard, ManageStudents, ManageHomeOwners, ManageListings, ManageReviews
│   │   ├── App.jsx                  # route configuration
│   │   └── main.jsx                 # app entry point
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, JWT secret, Brevo + Cloudinary keys
npm install
npm run dev             # starts on http://localhost:5000
```

Create the first admin account:

```bash
# set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env first (optional, has defaults)
npm run seed:admin
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # point to your backend URL + Google Maps key
npm install
npm run dev              # starts on http://localhost:5173
```

## Required Third-Party Accounts

| Service | Used for | Where to configure |
|---|---|---|
| MongoDB Atlas | Database | `backend/.env` → `MONGO_URI` |
| Brevo (Sendinblue) | Transactional email (verification, password reset) | `backend/.env` → `BREVO_SMTP_*`, `BREVO_API_KEY` |
| Cloudinary | Property & profile image storage | `backend/.env` → `CLOUDINARY_*` |
| Google Maps Platform | Property location display | `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY` |

## Core Flows Implemented

- **Auth:** register → email verification (mandatory before login) → JWT httpOnly cookie login → forgot/reset password → logout
- **Roles:** Student, Home Owner, Admin — each with separate dashboards and protected routes
- **Properties:** create (pending admin approval) → search/filter → detail view with Google Map → image gallery
- **Booking:** student sends request → owner accepts/rejects → real-time status push via Socket.IO → notification created
- **Reviews:** one review per student per property, average rating recalculated on every change
- **Admin:** approve/reject listings, block/delete users, moderate reviews, dashboard statistics
- **Real-time (Socket.IO events):** `propertyUpdated`, `availabilityUpdated`, `bookingRequested`, `bookingAccepted`,
  `bookingRejected`, `notificationReceived`, `propertyApproved`, `propertyRejected`

## Security Measures

JWT (httpOnly cookies) · bcrypt · role-based authorization middleware · protected routes ·
express-validator input validation · express-rate-limit · CORS with credentials · Helmet ·
express-mongo-sanitize · xss-clean · multer file-type/size limits before Cloudinary upload

## Deployment Notes

- Deploy `backend/` and `frontend/` as two separate services on Render.
- Set `CLIENT_URL` in the backend env to your deployed frontend URL (for CORS + cookie `sameSite=none`).
- Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` in the frontend env to your deployed backend URL.
- Use a MongoDB Atlas connection string with network access allowed from Render's IPs (or `0.0.0.0/0` for simplicity).

## Notes on Scope

This is a complete, working foundation covering every feature area in the PRD — auth, all
three role dashboards, property CRUD with image upload, search/filter, the booking workflow,
reviews, notifications, real-time Socket.IO updates, and admin moderation. Wire up your own
API keys (Mongo, Brevo, Cloudinary, Google Maps) and it runs end-to-end. From here it's meant
to be extended: pagination polish, richer admin analytics, chat between student and owner, etc.
can be layered on top of this structure.
