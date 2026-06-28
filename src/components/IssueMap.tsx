import React, { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Issue } from "../types";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.REACT_APP_MAPS_API_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface IssueMapProps {
  issues: Issue[];
  onSelectIssue?: (issue: Issue) => void;
}

// Inner map component that has access to useMap()
function MapContent({ issues, selectedIssue, setSelectedIssue }: {
  issues: Issue[];
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || issues.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;
    issues.forEach((issue) => {
      if (typeof issue.lat === "number" && typeof issue.lng === "number" && !isNaN(issue.lat) && !isNaN(issue.lng)) {
        bounds.extend({ lat: issue.lat, lng: issue.lng });
        hasCoords = true;
      }
    });

    if (hasCoords) {
      if (issues.length === 1) {
        map.setCenter({ lat: issues[0].lat, lng: issues[0].lng });
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, 50); // Add 50px padding
      }
    }
  }, [map, issues]);

  const getPinColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "#EF4444"; // Red
      case "Medium":
        return "#F59E0B"; // Orange
      case "Low":
      default:
        return "#10B981"; // Green
    }
  };

  return (
    <Map
      defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
      defaultZoom={12}
      mapId="DEMO_MAP_ID"
      mapTypeId="roadmap"
      disableDefaultUI={true}
      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
      style={{ width: "100%", height: "400px" }}
    >
      {issues.map((issue) => {
        if (typeof issue.lat !== "number" || typeof issue.lng !== "number" || isNaN(issue.lat) || isNaN(issue.lng)) {
          return null;
        }

        return (
          <AdvancedMarker
            key={issue.id}
            position={{ lat: issue.lat, lng: issue.lng }}
            onClick={() => setSelectedIssue(issue)}
            title={issue.description || issue.category}
          >
            <Pin
              background={getPinColor(issue.severity)}
              borderColor="#FFFFFF"
              glyphColor="#FFFFFF"
            />
          </AdvancedMarker>
        );
      })}

      {selectedIssue && (
        <InfoWindow
          position={{ lat: selectedIssue.lat, lng: selectedIssue.lng }}
          onCloseClick={() => setSelectedIssue(null)}
        >
          <div className="p-2 max-w-xs text-slate-800 font-sans">
            <h3 className="font-semibold text-sm capitalize mb-1 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{
                  backgroundColor:
                    selectedIssue.severity === "High"
                      ? "#EF4444"
                      : selectedIssue.severity === "Medium"
                      ? "#F59E0B"
                      : "#10B981"
                }}
              />
              {selectedIssue.category.replace(/_/g, " ")}
            </h3>
            <p className="text-xs text-slate-600 mb-2 font-medium">{selectedIssue.description}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 mt-1.5">
              <div>
                <span className="font-semibold text-slate-700">Severity:</span>{" "}
                <span
                  className={`font-semibold ${
                    selectedIssue.severity === "High"
                      ? "text-red-500"
                      : selectedIssue.severity === "Medium"
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                >
                  {selectedIssue.severity}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Status:</span>{" "}
                <span className="font-semibold text-blue-600">{selectedIssue.status}</span>
              </div>
              <div className="col-span-2 mt-1">
                <span className="font-semibold text-slate-700">Location:</span>{" "}
                <span className="text-slate-500 block truncate">{selectedIssue.location}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-700">Date:</span>{" "}
                <span>{new Date(selectedIssue.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function IssueMap({ issues, onSelectIssue }: IssueMapProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl h-[400px] text-center font-sans shadow-sm">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-2">
            📍
          </div>
          <h3 className="text-lg font-bold text-slate-800">Google Maps API Key Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The maps integration requires a valid Google Maps Platform API key. You can add this easily using AI Studio Secrets.
          </p>
          <div className="bg-white p-4 rounded-xl border border-slate-100 text-left text-xs text-slate-600 space-y-2 leading-relaxed shadow-sm">
            <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">Get an API Key</a> from the Google Cloud Console.</p>
            <p><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Add a secret named <code>GOOGLE_MAPS_PLATFORM_KEY</code> and paste your key.</li>
            </ul>
            <p className="text-[10px] text-slate-400 italic">The application rebuilds automatically when the key is added.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      <APIProvider apiKey={API_KEY} version="weekly">
        <MapContent
          issues={issues}
          selectedIssue={selectedIssue}
          setSelectedIssue={(issue) => {
            setSelectedIssue(issue);
            if (issue && onSelectIssue) {
              onSelectIssue(issue);
            }
          }}
        />
      </APIProvider>
    </div>
  );
}
