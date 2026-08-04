import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import LocationPickerMap from "../../components/property/LocationPickerMap";
import { propertyApi } from "../../api/endpoints";

const propertyTypes = [
  "Hostel", "Boys PG", "Girls PG", "Shared Room", "Single Room", "Flat", "Apartment", "Mess",
];

const emptyForm = {
  propertyName: "",
  propertyType: "Boys PG",
  contactNumber: "",
  email: "",
  address: { fullAddress: "", area: "", city: "", state: "", pincode: "" },
  location: { lat: null, lng: null },
  nearbyCollege: "",
  distanceFromCollege: "",
  pricing: { monthlyRent: "", securityDeposit: "", electricityCharges: "", waterCharges: "", internetCharges: "" },
  availability: { totalSeats: 1 },
  amenities: { wifi: false, attachedBathroom: false, commonBathroom: false, bed: false, fan: false, table: false, chair: false, wardrobe: false, parking: false, cctv: false },
  rules: { boysOnly: false, girlsOnly: false, visitorsAllowed: false, smokingAllowed: false },
  messDetails: { monthlyCharge: "", breakfast: false, lunch: false, dinner: false, foodType: "Veg", mealTiming: "" },
};

const AddPropertyPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const updateNested = (section, key, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      images.forEach((file) => formData.append("images", file));

      await propertyApi.create(formData);
      toast.success("Property submitted for admin approval.");
      navigate("/owner/properties");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Add Property</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Property Name</label>
              <input className="input" required value={form.propertyName}
                onChange={(e) => setForm({ ...form, propertyName: e.target.value })} />
            </div>
            <div>
              <label className="label">Property Type</label>
              <select className="input" value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input" required value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Nearby College</label>
              <input className="input" value={form.nearbyCollege}
                onChange={(e) => setForm({ ...form, nearbyCollege: e.target.value })} />
            </div>
            <div>
              <label className="label">Distance from College (km)</label>
              <input type="number" step="0.1" className="input" value={form.distanceFromCollege}
                onChange={(e) => setForm({ ...form, distanceFromCollege: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Address</label>
              <input className="input" required value={form.address.fullAddress}
                onChange={(e) => updateNested("address", "fullAddress", e.target.value)} />
            </div>
            <div>
              <label className="label">Area</label>
              <input className="input" required value={form.address.area}
                onChange={(e) => updateNested("address", "area", e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" required value={form.address.city}
                onChange={(e) => updateNested("address", "city", e.target.value)} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.address.state}
                onChange={(e) => updateNested("address", "state", e.target.value)} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.address.pincode}
                onChange={(e) => updateNested("address", "pincode", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Location on map */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Location on Map</h2>
          <LocationPickerMap
            lat={form.location.lat}
            lng={form.location.lng}
            onChange={([lat, lng]) => setForm((prev) => ({ ...prev, location: { lat, lng } }))}
          />
        </section>

        {/* Pricing */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Pricing (₹)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Rent</label>
              <input type="number" className="input" required value={form.pricing.monthlyRent}
                onChange={(e) => updateNested("pricing", "monthlyRent", e.target.value)} />
            </div>
            <div>
              <label className="label">Security Deposit</label>
              <input type="number" className="input" value={form.pricing.securityDeposit}
                onChange={(e) => updateNested("pricing", "securityDeposit", e.target.value)} />
            </div>
            <div>
              <label className="label">Electricity Charges</label>
              <input type="number" className="input" value={form.pricing.electricityCharges}
                onChange={(e) => updateNested("pricing", "electricityCharges", e.target.value)} />
            </div>
            <div>
              <label className="label">Water Charges</label>
              <input type="number" className="input" value={form.pricing.waterCharges}
                onChange={(e) => updateNested("pricing", "waterCharges", e.target.value)} />
            </div>
            <div>
              <label className="label">Internet Charges</label>
              <input type="number" className="input" value={form.pricing.internetCharges}
                onChange={(e) => updateNested("pricing", "internetCharges", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Availability</h2>
          <div>
            <label className="label">Total Seats</label>
            <input type="number" min="1" className="input max-w-xs" required value={form.availability.totalSeats}
              onChange={(e) => updateNested("availability", "totalSeats", e.target.value)} />
          </div>
        </section>

        {/* Amenities */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Amenities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.keys(form.amenities).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink-700 capitalize">
                <input type="checkbox" checked={form.amenities[key]}
                  onChange={(e) => updateNested("amenities", key, e.target.checked)} />
                {key.replace(/([A-Z])/g, " $1")}
              </label>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Rules</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(form.rules).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink-700 capitalize">
                <input type="checkbox" checked={form.rules[key]}
                  onChange={(e) => updateNested("rules", key, e.target.checked)} />
                {key.replace(/([A-Z])/g, " $1")}
              </label>
            ))}
          </div>
        </section>

        {/* Mess details (only relevant for Mess type) */}
        {form.propertyType === "Mess" && (
          <section className="card p-6 space-y-4">
            <h2 className="font-semibold text-ink-900">Mess Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Charge</label>
                <input type="number" className="input" value={form.messDetails.monthlyCharge}
                  onChange={(e) => updateNested("messDetails", "monthlyCharge", e.target.value)} />
              </div>
              <div>
                <label className="label">Food Type</label>
                <select className="input" value={form.messDetails.foodType}
                  onChange={(e) => updateNested("messDetails", "foodType", e.target.value)}>
                  <option>Veg</option><option>Non-Veg</option><option>Both</option>
                </select>
              </div>
              <div>
                <label className="label">Meal Timing</label>
                <input className="input" placeholder="e.g. 8-10am, 1-3pm, 8-10pm" value={form.messDetails.mealTiming}
                  onChange={(e) => updateNested("messDetails", "mealTiming", e.target.value)} />
              </div>
              <div className="flex items-center gap-4 pt-6">
                {["breakfast", "lunch", "dinner"].map((meal) => (
                  <label key={meal} className="flex items-center gap-2 text-sm text-ink-700 capitalize">
                    <input type="checkbox" checked={form.messDetails[meal]}
                      onChange={(e) => updateNested("messDetails", meal, e.target.checked)} />
                    {meal}
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Images */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Property Images</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="text-sm"
          />
          {images.length > 0 && <p className="text-xs text-ink-500">{images.length} image(s) selected</p>}
        </section>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </DashboardLayout>
  );
};

export default AddPropertyPage;
