import React from "react";

const propertyTypes = [
  "Hostel",
  "Boys PG",
  "Girls PG",
  "Shared Room",
  "Single Room",
  "Flat",
  "Apartment",
  "Mess",
];

const amenitiesList = ["wifi", "attachedBathroom", "parking", "cctv", "wardrobe"];

const SearchFilters = ({ filters, onChange, onApply, onReset }) => {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const toggleAmenity = (amenity) => {
    const current = filters.amenities ? filters.amenities.split(",").filter(Boolean) : [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    update("amenities", next.join(","));
  };

  return (
    <div className="card p-5 space-y-5">
      <div>
        <label className="label">Nearby College</label>
        <input
          className="input"
          placeholder="e.g. IIT Delhi"
          value={filters.college || ""}
          onChange={(e) => update("college", e.target.value)}
        />
      </div>

      <div>
        <label className="label">Area</label>
        <input
          className="input"
          placeholder="e.g. Hauz Khas"
          value={filters.area || ""}
          onChange={(e) => update("area", e.target.value)}
        />
      </div>

      <div>
        <label className="label">Property Type</label>
        <select
          className="input"
          value={filters.propertyType || ""}
          onChange={(e) => update("propertyType", e.target.value)}
        >
          <option value="">Any type</option>
          {propertyTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Monthly Rent (₹)</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="input"
            placeholder="Min"
            value={filters.minRent || ""}
            onChange={(e) => update("minRent", e.target.value)}
          />
          <input
            type="number"
            className="input"
            placeholder="Max"
            value={filters.maxRent || ""}
            onChange={(e) => update("maxRent", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Gender Preference</label>
        <select
          className="input"
          value={filters.gender || ""}
          onChange={(e) => update("gender", e.target.value)}
        >
          <option value="">Any</option>
          <option value="boys">Boys Only</option>
          <option value="girls">Girls Only</option>
        </select>
      </div>

      <div>
        <label className="label">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {amenitiesList.map((a) => {
            const active = filters.amenities?.split(",").includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`badge border ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-ink-600 border-ink-200"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onApply} className="btn-primary flex-1">Apply</button>
        <button onClick={onReset} className="btn-secondary">Reset</button>
      </div>
    </div>
  );
};

export default SearchFilters;
