import React from "react";

const StatCard = ({ icon: Icon, label, value, tone = "brand" }) => {
  const toneStyles = {
    brand: "bg-brand-50 text-brand-600",
    accent: "bg-accent-50 text-accent-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="stat-card">
      <div>
        <p className="text-xs font-medium text-ink-500 mb-1.5">{label}</p>
        <p className="text-2xl font-semibold text-ink-900 tracking-tight">{value}</p>
      </div>
      {Icon && (
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
