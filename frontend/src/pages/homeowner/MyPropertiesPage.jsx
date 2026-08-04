import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { propertyApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const MyPropertiesPage = () => {
  const { socket } = useSocket();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await propertyApi.getMine();
    setProperties(data.data.properties);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Reflect admin approve/reject decisions here instantly, without a manual refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("propertyApproved", refresh);
    socket.on("propertyRejected", refresh);
    socket.on("propertyUpdated", refresh);
    socket.on("propertyDeleted", refresh);
    return () => {
      socket.off("propertyApproved", refresh);
      socket.off("propertyRejected", refresh);
      socket.off("propertyUpdated", refresh);
      socket.off("propertyDeleted", refresh);
    };
  }, [socket]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    try {
      await propertyApi.remove(id);
      toast.success("Property deleted");
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="page-heading">My Properties</h1>
        <Link to="/owner/properties/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          You haven't listed any properties yet.
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <img
                  src={p.images?.[0]?.url || "https://placehold.co/80x80"}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{p.propertyName}</p>
                  <p className="text-xs text-ink-500 truncate">{p.propertyType} · {p.address?.area}, {p.address?.city}</p>
                  <p className="text-xs text-ink-500 mt-1">
                    {p.availability?.occupiedSeats}/{p.availability?.totalSeats} seats occupied
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
                <div className="flex gap-3">
                  <Link to={`/owner/properties/${p._id}/edit`} className="text-xs text-brand-600 font-medium">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(p._id)} className="text-xs text-red-600 font-medium">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyPropertiesPage;
