import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Wifi, Users } from "lucide-react";
import RatingStars from "../common/RatingStars";

const PropertyCard = ({ property }) => {
  const {
    _id,
    propertyName,
    propertyType,
    images,
    address,
    pricing,
    availableSeats,
    amenities,
    averageRating,
    totalReviews,
  } = property;

  const cover = images?.[0]?.url || "https://placehold.co/400x260?text=CollegeStay";

  return (
    <Link
      to={`/properties/${_id}`}
      className="card overflow-hidden group hover:shadow-card transition-shadow"
    >
      <div className="aspect-[4/3] overflow-hidden bg-ink-100">
        <img
          src={cover}
          alt={propertyName}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink-900 text-sm leading-snug">{propertyName}</h3>
          <span className="badge bg-brand-50 text-brand-700 shrink-0">{propertyType}</span>
        </div>

        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5" />
          {address?.area}, {address?.city}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink-900">
            ₹{pricing?.monthlyRent?.toLocaleString()}
            <span className="text-xs font-normal text-ink-500"> /month</span>
          </div>
          <RatingStars rating={averageRating} showValue={totalReviews > 0} size={14} />
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {availableSeats ?? 0} seats left
          </span>
          {amenities?.wifi && (
            <span className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" /> WiFi
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
