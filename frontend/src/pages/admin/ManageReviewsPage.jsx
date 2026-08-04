import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import RatingStars from "../../components/common/RatingStars";
import { adminApi } from "../../api/endpoints";

const ManageReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await adminApi.getAllReviews();
    setReviews(data.data.reviews);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await adminApi.deleteReview(id);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-6">Manage Reviews</h1>

      {reviews.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No reviews submitted yet.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="card p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink-900">{r.student?.fullName}</span>
                  <RatingStars rating={r.rating} showValue={false} size={14} />
                </div>
                <p className="text-xs text-ink-500 mt-1">On: {r.property?.propertyName}</p>
                {r.comment && <p className="text-sm text-ink-600 mt-2">{r.comment}</p>}
              </div>
              <button onClick={() => handleDelete(r._id)} className="text-xs text-red-600 font-medium shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageReviewsPage;
