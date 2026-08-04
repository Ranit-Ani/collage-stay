import React from "react";
import { Loader2 } from "lucide-react";

const Loader = ({ label = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-20 text-ink-500">
    <Loader2 className="h-7 w-7 animate-spin text-brand-600 mb-2" />
    <p className="text-sm">{label}</p>
  </div>
);

export default Loader;
