import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import { adminApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const ManageHomeOwnersPage = () => {
  const { socket } = useSocket();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await adminApi.getHomeOwners();
    setOwners(data.data.owners);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // New sign-ups, blocks/unblocks (from this tab or another admin), and
  // deletions all reflect here without a manual refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("newUserRegistered", refresh);
    socket.on("userStatusChanged", refresh);
    socket.on("userDeleted", refresh);
    return () => {
      socket.off("newUserRegistered", refresh);
      socket.off("userStatusChanged", refresh);
      socket.off("userDeleted", refresh);
    };
  }, [socket]);

  const handleToggleBlock = async (id) => {
    try {
      await adminApi.toggleBlockUser(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this home owner account permanently?")) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("Home owner deleted");
      setOwners((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Manage Home Owners</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => (
              <tr key={o._id} className="border-t border-ink-100">
                <td className="px-4 py-3 text-ink-800">{o.fullName}</td>
                <td className="px-4 py-3 text-ink-600">{o.email}</td>
                <td className="px-4 py-3 text-ink-600">{o.businessName || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${o.isBlocked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {o.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => handleToggleBlock(o._id)} className="text-brand-600 font-medium text-xs">
                    {o.isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button onClick={() => handleDelete(o._id)} className="text-red-600 font-medium text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default ManageHomeOwnersPage;
