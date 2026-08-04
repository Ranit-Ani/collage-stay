import React from "react";
import { Star } from "lucide-react";

const RatingStars = ({ rating = 0, size = 16, showValue = true, interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-ink-200"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
      {showValue && (
        <span className="text-xs text-ink-500 ml-1">{rating ? rating.toFixed(1) : "New"}</span>
      )}
    </div>
  );
};

export default RatingStars;
