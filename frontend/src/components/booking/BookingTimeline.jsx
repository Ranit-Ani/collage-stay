import React from "react";
import { CheckCircle2 } from "lucide-react";

const BookingTimeline = ({ timeline = [] }) => {
  if (!timeline.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-ink-100">
      <p className="section-title">Booking Timeline</p>
      <ol className="space-y-3">
        {[...timeline].reverse().map((t, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-ink-800">{t.status}</p>
              {t.note && <p className="text-ink-500 text-xs mt-0.5">{t.note}</p>}
              <p className="text-ink-400 text-xs mt-0.5">
                {new Date(t.at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default BookingTimeline;
