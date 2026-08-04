import React, { useState } from "react";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { studentApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";

const StudentProfilePage = () => {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    collegeName: user?.collegeName || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studentApi.updateProfile(form);
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await studentApi.uploadProfilePicture(formData);
      await refresh();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-6">My Profile</h1>

      <div className="card p-6 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          {user?.profilePicture?.url ? (
            <img src={user.profilePicture.url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-ink-300" />
          )}
          <div>
            <label className="btn-secondary cursor-pointer inline-flex">
              {uploading ? "Uploading..." : "Change Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">College Name</label>
            <input
              className="input"
              value={form.collegeName}
              onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-ink-50" value={user?.email} disabled />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;
