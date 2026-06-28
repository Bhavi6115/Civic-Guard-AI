import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import AddressInput from "./AddressInput";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category: string;
    severity: "Low" | "Medium" | "High";
    description: string;
    location: string;
    image: string | null;
    lat: number;
    lng: number;
  }) => void;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to SF Center
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High">("Low");
  const [isDragActive, setIsDragActive] = useState(false);

  // States for Gemini Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImageWithGemini = async (base64String: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAiSuccessMessage(null);

    try {
      // Call our backend API endpoint
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageData: base64String,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Auto-fill fields from Gemini response
      if (data.category) {
        // Map any potholes variations from Gemini
        if (data.category === "potholes" || data.category === "pothole") {
          setCategory("pothole");
        } else {
          setCategory(data.category);
        }
      }
      if (data.severity) {
        setSeverity(data.severity);
      }
      if (data.description) {
        setDescription(data.description);
      }

      setAiSuccessMessage("Gemini analyzed the image and successfully auto-filled the fields!");
    } catch (err: any) {
      console.error("Gemini analysis failed:", err);
      setErrorMessage(`AI analysis unavailable: ${err.message || err}. You can still fill the fields manually.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.match("image.*")) {
      setErrorMessage("Please select an image file (JPG, PNG, or WEBP).");
      return;
    }

    setImageFile(file);
    const base64 = await fileToBase64(file);
    setImage(base64);

    // Trigger Gemini analysis as soon as image is uploaded
    analyzeImageWithGemini(base64, file.type);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleLocationChange = (address: string, lat?: number, lng?: number) => {
    setLocation(address);
    if (lat !== undefined && lng !== undefined) {
      setCoordinates({ lat, lng });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setErrorMessage("An issue image is required. Please upload an image to continue.");
      return;
    }
    if (!location) {
      setErrorMessage("Location is required.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        category,
        severity,
        description: description || "No description provided",
        location,
        image,
        lat: coordinates.lat,
        lng: coordinates.lng
      });
      setIsSubmitting(false);
      resetForm();
      onClose();
    }, 800);
  };

  const resetForm = () => {
    setImage(null);
    setImageFile(null);
    setLocation("");
    setDescription("");
    setCategory("other");
    setSeverity("Low");
    setAiSuccessMessage(null);
    setErrorMessage(null);
    setCoordinates({ lat: 37.7749, lng: -122.4194 });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Report an Issue
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Submit community issues with accurate location and automated Gemini AI image analysis.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900">
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-750 dark:text-rose-400 rounded-lg text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
              <span>{aiSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Image Area */}
            <div className="space-y-4">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Image</label>
              
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-[260px] relative overflow-hidden group ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />

                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-4 py-2 bg-white/95 text-slate-800 font-semibold rounded-lg text-xs shadow-md flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        Replace Image
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-600 flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click or drag image to upload</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Accepts JPG, PNG, WEBP (max 10MB)</p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors pointer-events-none"
                    >
                      Browse Files
                    </button>
                  </div>
                )}

                {/* Gemini AI Analyzing Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3">Gemini is Analyzing...</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-xs mt-1">
                      Scanning photo for pothole, street light, garbage, or leaks.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Form Inputs */}
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Location Address <span className="text-rose-500">*</span>
                </label>
                <AddressInput
                  value={location}
                  onChange={handleLocationChange}
                  placeholder="Enter location address or landmark..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category / AI Detection</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "pothole", label: "Pothole" },
                    { id: "broken_streetlight", label: "Streetlight" },
                    { id: "garbage", label: "Garbage" },
                    { id: "water_leak", label: "Water Leak" },
                    { id: "other", label: "Other" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all truncate text-center ${
                        category === cat.id
                          ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Severity Level</label>
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all text-center ${
                        severity === sev
                          ? sev === "High"
                            ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-100/50"
                            : sev === "Medium"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-100/50"
                            : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 transition-all text-sm h-24 resize-none placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Describe the issue in more detail..."
                />
              </div>
            </div>
          </div>

          {/* Form Footer / Submit */}
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 justify-end">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-bold transition-all cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzing || !location}
              className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer active:scale-[0.98] ${
                isSubmitting || isAnalyzing || !location ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
