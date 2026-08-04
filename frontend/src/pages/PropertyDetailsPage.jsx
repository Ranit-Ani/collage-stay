import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Users, Wifi, Bed, Car, ShieldCheck } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Loader from "../components/common/Loader";
import RatingStars from "../components/common/RatingStars";
import PropertyMapView from "../components/property/PropertyMapView";
import { propertyApi, reviewApi, bookingApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const amenityIcons = { wifi: Wifi, bed: Bed, parking: Car, cctv: ShieldCheck };

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [propRes, reviewRes] = await Promise.all([
        propertyApi.getById(id),
        reviewApi.getForProperty(id),
      ]);
      setProperty(propRes.data.data.property);
      setReviews(reviewRes.data.data.reviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ propertyId, availableSeats }) => {
      if (propertyId === id) {
        setProperty((prev) => (prev ? { ...prev, availableSeats } : prev));
      }
    };
    socket.on("availabilityUpdated", handler);
    return () => socket.off("availabilityUpdated", handler);
  }, [socket, id]);

  const handleBookingRequest = async () => {
    if (!user) return toast.error("Please log in as a student to send a booking request.");
    setRequesting(true);
    try {
      await bookingApi.create({ propertyId: id });
      toast.success("Booking request sent to the home owner!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Loader label="Loading property details..." />;
  if (!property) return null;

  const { propertyName, propertyType, images, address, location, pricing, availability,
    availableSeats, amenities, rules, nearbyCollege, distanceFromCollege, owner,
    averageRating, totalReviews, messDetails } = property;

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          {/* Image gallery */}
          <div className="card overflow-hidden">
            <img
              src={images?.[activeImage]?.url || "https://placehold.co/800x500?text=CollegeStay"}
              alt={propertyName}
              className="w-full aspect-[16/10] object-cover"
            />
            {images?.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.publicId || i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-20 rounded-md overflow-hidden shrink-0 border-2 ${
                      activeImage === i ? "border-brand-600" : "border-transparent"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="card p-6 mt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-ink-900">{propertyName}</h1>
                <p className="flex items-center gap-1 text-sm text-ink-500 mt-1">
                  <MapPin className="h-4 w-4" /> {address?.fullAddress}
                </p>
              </div>
              <span className="badge bg-brand-50 text-brand-700 shrink-0">{propertyType}</span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-ink-600">
              <RatingStars rating={averageRating} showValue />
              <span>({totalReviews} reviews)</span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {availableSeats} of {availability?.totalSeats} seats available
              </span>
            </div>

            {nearbyCollege && (
              <p className="mt-3 text-sm text-ink-600">
                {distanceFromCollege} km from <strong>{nearbyCollege}</strong>
              </p>
            )}

            {/* Amenities */}
            <div className="mt-6">
              <h2 className="font-semibold text-ink-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(amenities || {})
                  .filter(([, v]) => v)
                  .map(([key]) => {
                    const Icon = amenityIcons[key] || ShieldCheck;
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm text-ink-600">
                        <Icon className="h-4 w-4 text-brand-600" />
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Rules */}
            <div className="mt-6">
              <h2 className="font-semibold text-ink-900 mb-3">House Rules</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {rules?.boysOnly && <span className="badge bg-ink-100 text-ink-600">Boys Only</span>}
                {rules?.girlsOnly && <span className="badge bg-ink-100 text-ink-600">Girls Only</span>}
                {rules?.visitorsAllowed && <span className="badge bg-ink-100 text-ink-600">Visitors Allowed</span>}
                {rules?.smokingAllowed && <span className="badge bg-ink-100 text-ink-600">Smoking Allowed</span>}
              </div>
            </div>

            {propertyType === "Mess" && messDetails && (
              <div className="mt-6">
                <h2 className="font-semibold text-ink-900 mb-3">Mess Details</h2>
                <p className="text-sm text-ink-600">
                  ₹{messDetails.monthlyCharge}/month · {messDetails.foodType} ·{" "}
                  {[messDetails.breakfast && "Breakfast", messDetails.lunch && "Lunch", messDetails.dinner && "Dinner"]
                    .filter(Boolean)
                    .join(", ")}
                  {messDetails.mealTiming && ` · ${messDetails.mealTiming}`}
                </p>
              </div>
            )}

            {/* Map */}
            {location?.lat && location?.lng && (
              <div className="mt-6">
                <h2 className="font-semibold text-ink-900 mb-3">Location</h2>
                <div className="rounded-lg overflow-hidden">
                  <PropertyMapView lat={location.lat} lng={location.lng} label={propertyName} />
                </div>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="card p-6 mt-6">
            <h2 className="font-semibold text-ink-900 mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r._id} className="border-b border-ink-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-800">{r.student?.fullName}</span>
                      <RatingStars rating={r.rating} showValue={false} size={14} />
                    </div>
                    {r.comment && <p className="text-sm text-ink-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking / contact sidebar */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <div className="card p-6">
            <div className="text-2xl font-semibold text-ink-900">
              ₹{pricing?.monthlyRent?.toLocaleString()}
              <span className="text-sm font-normal text-ink-500"> /month</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-ink-600">
              <div className="flex justify-between">
                <dt>Security Deposit</dt><dd>₹{pricing?.securityDeposit?.toLocaleString() || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Electricity</dt><dd>₹{pricing?.electricityCharges?.toLocaleString() || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Water</dt><dd>₹{pricing?.waterCharges?.toLocaleString() || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Internet</dt><dd>₹{pricing?.internetCharges?.toLocaleString() || 0}</dd>
              </div>
            </dl>

            <button
              onClick={handleBookingRequest}
              disabled={requesting || availableSeats <= 0}
              className="btn-primary w-full mt-5"
            >
              {availableSeats <= 0 ? "No Seats Available" : requesting ? "Sending..." : "Send Booking Request"}
            </button>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-3">Contact Home Owner</h3>
            <p className="text-sm text-ink-600">{owner?.fullName}</p>
            <p className="text-sm text-ink-500">{owner?.phone}</p>
            <p className="text-sm text-ink-500">{owner?.email}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
