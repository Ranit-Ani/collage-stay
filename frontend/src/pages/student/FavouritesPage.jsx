import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import PropertyCard from "../../components/property/PropertyCard";
import { studentApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const FavouritesPage = () => {
  const { socket } = useSocket();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await studentApi.getFavourites();
    setFavourites(data.data.favourites);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Live seat counts, and drop a favourite instantly if it's ever removed
  useEffect(() => {
    if (!socket) return;
    const onAvailability = ({ propertyId, availableSeats }) => {
      setFavourites((prev) =>
        prev.map((p) => (p._id === propertyId ? { ...p, availableSeats } : p))
      );
    };
    const onDeleted = ({ propertyId }) => {
      setFavourites((prev) => prev.filter((p) => p._id !== propertyId));
    };
    socket.on("availabilityUpdated", onAvailability);
    socket.on("propertyDeleted", onDeleted);
    return () => {
      socket.off("availabilityUpdated", onAvailability);
      socket.off("propertyDeleted", onDeleted);
    };
  }, [socket]);

  const handleRemove = async (propertyId) => {
    try {
      await studentApi.removeFavourite(propertyId);
      toast.success("Removed from favourites");
      setFavourites((prev) => prev.filter((p) => p._id !== propertyId));
    } catch {
      toast.error("Failed to remove favourite");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Favourite Properties</h1>

      {favourites.length === 0 ? (
        <div className="card p-10 text-center text-ink-500 flex flex-col items-center gap-2">
          <Heart className="h-6 w-6" />
          No favourites saved yet. Browse properties and tap the heart icon to save them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {favourites.map((p) => (
            <div key={p._id} className="relative">
              <PropertyCard property={p} />
              <button
                onClick={() => handleRemove(p._id)}
                className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow"
                aria-label="Remove favourite"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default FavouritesPage;
