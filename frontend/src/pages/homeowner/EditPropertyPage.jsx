import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import LocationPickerMap from "../../components/property/LocationPickerMap";
import { propertyApi } from "../../api/endpoints";

const EditPropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImages, setNewImages] = useState([]);

  const load = async () => {
    const { data } = await propertyApi.getById(id);
    setProperty(data.data.property);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const updateField = (path, value) => {
    setProperty((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await propertyApi.update(id, {
        propertyName: property.propertyName,
        contactNumber: property.contactNumber,
        email: property.email,
        address: property.address,
        location: property.location,
        nearbyCollege: property.nearbyCollege,
        distanceFromCollege: property.distanceFromCollege,
        pricing: property.pricing,
        amenities: property.amenities,
        rules: property.rules,
      });
      toast.success("Property updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityUpdate = async () => {
    try {
      await propertyApi.updateAvailability(id, {
        totalSeats: property.availability.totalSeats,
        occupiedSeats: property.availability.occupiedSeats,
      });
      toast.success("Availability updated — live for all viewers now.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleAddImages = async () => {
    if (newImages.length === 0) return;
    try {
      const formData = new FormData();
      newImages.forEach((f) => formData.append("images", f));
      const { data } = await propertyApi.addImages(id, formData);
      setProperty((prev) => ({ ...prev, images: data.data.images }));
      setNewImages([]);
      toast.success("Images added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDeleteImage = async (publicId) => {
    try {
      const { data } = await propertyApi.deleteImage(id, publicId);
      setProperty((prev) => ({ ...prev, images: data.data.images }));
    } catch (err) {
      toast.error("Failed to delete image");
    }
  };

  if (loading || !property) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="page-heading">Edit Property</h1>
        <StatusBadge status={property.status} />
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Images */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Images</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {property.images?.map((img) => (
              <div key={img.publicId} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => handleDeleteImage(img.publicId)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="file" multiple accept="image/*" className="text-sm"
              onChange={(e) => setNewImages(Array.from(e.target.files))} />
            <button onClick={handleAddImages} className="btn-secondary !py-1.5 !px-3 text-xs">Upload</button>
          </div>
        </section>

        {/* Availability */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Availability</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Total Seats</label>
              <input type="number" min="1" className="input" value={property.availability.totalSeats}
                onChange={(e) => updateField("availability.totalSeats", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Occupied Seats</label>
              <input type="number" min="0" className="input" value={property.availability.occupiedSeats}
                onChange={(e) => updateField("availability.occupiedSeats", Number(e.target.value))} />
            </div>
          </div>
          <button onClick={handleAvailabilityUpdate} className="btn-secondary">Update Availability</button>
        </section>

        {/* Location on map */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Location on Map</h2>
          <LocationPickerMap
            lat={property.location?.lat}
            lng={property.location?.lng}
            onChange={([lat, lng]) => updateField("location", { lat, lng })}
          />
        </section>

        {/* Basic details */}
        <form onSubmit={handleSaveDetails} className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Property Name</label>
              <input className="input" value={property.propertyName}
                onChange={(e) => updateField("propertyName", e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input" value={property.contactNumber}
                onChange={(e) => updateField("contactNumber", e.target.value)} />
            </div>
            <div>
              <label className="label">Monthly Rent (₹)</label>
              <input type="number" className="input" value={property.pricing.monthlyRent}
                onChange={(e) => updateField("pricing.monthlyRent", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={property.address.city}
                onChange={(e) => updateField("address.city", e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <button onClick={() => navigate("/owner/properties")} className="text-sm text-ink-500">
          ← Back to My Properties
        </button>
      </div>
    </DashboardLayout>
  );
};

export default EditPropertyPage;
