import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import SearchFilters from "../components/property/SearchFilters";
import PropertyCard from "../components/property/PropertyCard";
import Loader from "../components/common/Loader";
import { propertyApi } from "../api/endpoints";
import { useSocket } from "../context/SocketContext";

const SearchPage = () => {
  const { socket } = useSocket();
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });

  const fetchProperties = useCallback(async (activeFilters, page = 1) => {
    setLoading(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== "" && v !== undefined)
      );
      const { data } = await propertyApi.search({ ...cleaned, page });
      setProperties(data.data.properties);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters, 1);
  }, []); // initial load

  // Real-time: refresh available seat counts without a manual refresh
  useEffect(() => {
    if (!socket) return;
    const handler = ({ propertyId, availableSeats }) => {
      setProperties((prev) =>
        prev.map((p) => (p._id === propertyId ? { ...p, availableSeats } : p))
      );
    };
    socket.on("availabilityUpdated", handler);
    return () => socket.off("availabilityUpdated", handler);
  }, [socket]);

  // A listing newly approved, edited, or removed should be reflected in
  // search results right away, without the student needing to refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchProperties(filters, meta.page || 1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, filters, meta.page]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          onApply={() => fetchProperties(filters, 1)}
          onReset={() => {
            setFilters({});
            fetchProperties({}, 1);
          }}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-ink-900">
              {meta.total} {meta.total === 1 ? "property" : "properties"} found
            </h1>
          </div>

          {loading ? (
            <Loader label="Searching properties..." />
          ) : properties.length === 0 ? (
            <div className="card p-10 text-center text-ink-500">
              No properties match your filters yet. Try widening your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          )}

          {meta.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => fetchProperties(filters, pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium ${
                    meta.page === pageNum
                      ? "bg-brand-600 text-white"
                      : "bg-white text-ink-600 border border-ink-200"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
