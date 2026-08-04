import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Search } from "lucide-react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // India, roughly centered

// Recenters the map imperatively whenever a search result comes in
const FlyTo = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position]);
  return null;
};

// Places/moves the marker wherever the owner clicks
const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

/**
 * Lets a home owner set a property's map location for free:
 * search an address (OpenStreetMap Nominatim geocoding) or click directly on the map.
 * No API key required.
 */
const LocationPickerMap = ({ lat, lng, onChange }) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const position = lat && lng ? [lat, lng] : null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const results = await res.json();
      if (results.length === 0) {
        alert("No matching location found. Try a more specific address.");
        return;
      }
      const { lat: foundLat, lon: foundLng } = results[0];
      onChange([Number(foundLat), Number(foundLng)]);
    } catch {
      alert("Location search failed. You can still click directly on the map to set a pin.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="input"
          placeholder="Search an address, area, or landmark..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching} className="btn-secondary shrink-0">
          <Search className="h-4 w-4" /> {searching ? "Searching..." : "Search"}
        </button>
      </form>
      <p className="text-xs text-ink-500">
        Search for the address above, then fine-tune by clicking directly on the map to drop the pin.
      </p>

      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={position ? 15 : 5}
        style={{ height: "280px", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {position && <FlyTo position={position} />}
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat: newLat, lng: newLng } = e.target.getLatLng();
                onChange([newLat, newLng]);
              },
            }}
          />
        )}
      </MapContainer>

      {position && (
        <p className="text-xs text-ink-500">
          Selected: {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default LocationPickerMap;
