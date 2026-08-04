import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import { adminApi } from "../../api/endpoints";

const ManageListingsPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await adminApi.getPendingProperties();
    setProperties(data.data.properties);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveProperty(id);
      toast.success("Property approved");
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleReject = async () => {
    try {
      await adminApi.rejectProperty(rejectTarget, reason);
      toast.success("Property rejected");
      setProperties((prev) => prev.filter((p) => p._id !== rejectTarget));
      setRejectTarget(null);
      setReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Pending Listings</h1>

      {properties.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No listings awaiting approval.</div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p._id} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={p.images?.[0]?.url || "https://placehold.co/80x80"} alt=""
                  className="h-16 w-16 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-ink-900">{p.propertyName}</p>
                  <p className="text-xs text-ink-500">{p.propertyType} · {p.address?.area}, {p.address?.city}</p>
                  <p className="text-xs text-ink-500 mt-1">Owner: {p.owner?.fullName} · {p.owner?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(p._id)} className="btn-primary !py-1.5 !px-3 text-xs">
                  Approve
                </button>
                <button
                  onClick={() => setRejectTarget(p._id)}
                  className="btn-danger !py-1.5 !px-3 text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Listing"
        footer={
          <>
            <button onClick={() => setRejectTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} className="btn-danger">Reject Listing</button>
          </>
        }
      >
        <label className="label">Reason for rejection</label>
        <textarea
          className="input min-h-[100px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Missing address details, unclear images..."
        />
      </Modal>
    </DashboardLayout>
  );
};

export default ManageListingsPage;
