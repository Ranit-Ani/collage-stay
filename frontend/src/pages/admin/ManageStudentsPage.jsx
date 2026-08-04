import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import { adminApi } from "../../api/endpoints";

const ManageStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await adminApi.getStudents();
    setStudents(data.data.students);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggleBlock = async (id) => {
    try {
      await adminApi.toggleBlockUser(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student account permanently?")) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("Student deleted");
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-6">Manage Students</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">College</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t border-ink-100">
                <td className="px-4 py-3 text-ink-800">{s.fullName}</td>
                <td className="px-4 py-3 text-ink-600">{s.email}</td>
                <td className="px-4 py-3 text-ink-600">{s.collegeName || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.isBlocked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {s.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => handleToggleBlock(s._id)} className="text-brand-600 font-medium text-xs">
                    {s.isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-600 font-medium text-xs">
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

export default ManageStudentsPage;
