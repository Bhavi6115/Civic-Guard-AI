import React, { useState, useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface AddressInputProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  className?: string;
  placeholder?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.REACT_APP_MAPS_API_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "";

export default function AddressInput({
  value,
  onChange,
  className = "",
  placeholder = "Enter location address or landmark..."
}: AddressInputProps) {
  const placesLib = useMapsLibrary("places");
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const styleInjectedRef = useRef<boolean>(false);

  // Inject global styles for Google Maps autocomplete
  useEffect(() => {
    if (styleInjectedRef.current) return;

    const style = document.createElement('style');
    style.textContent = `
      /* Force black text on Google Maps autocomplete input */
      gmp-place-autocomplete {
        --gmpx-color-on-surface: #000000 !important;
        --gmpx-color-surface: #ffffff !important;
      }
      
      gmp-place-autocomplete input,
      gmp-place-autocomplete input::placeholder {
        color: #000000 !important;
        font-size: 14px !important;
        font-family: 'Inter', system-ui, sans-serif !important;
        background: transparent !important;
      }
      
      /* Force black text on autocomplete dropdown */
      .pac-container {
        background-color: #ffffff !important;
        border-radius: 8px !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
        z-index: 9999 !important;
      }
      
      .pac-item {
        color: #000000 !important;
        background-color: #ffffff !important;
        padding: 10px 16px !important;
        font-size: 14px !important;
        border-bottom: 1px solid #f1f5f9 !important;
        cursor: pointer !important;
        font-family: 'Inter', system-ui, sans-serif !important;
      }
      
      .pac-item:hover {
        background-color: #f0f7ff !important;
      }
      
      .pac-item:last-child {
        border-bottom: none !important;
      }
      
      .pac-item-query {
        color: #000000 !important;
        font-weight: 600 !important;
      }
      
      .pac-matched {
        color: #2563eb !important;
      }
      
      .pac-icon {
        display: none !important;
      }
      
      /* Dark mode support */
      .dark .pac-container {
        background-color: #1e293b !important;
        border-color: #334155 !important;
      }
      
      .dark .pac-item {
        color: #f1f5f9 !important;
        background-color: #1e293b !important;
        border-bottom-color: #334155 !important;
      }
      
      .dark .pac-item:hover {
        background-color: #334155 !important;
      }
      
      .dark .pac-item-query {
        color: #f1f5f9 !important;
      }
      
      .dark .pac-matched {
        color: #60a5fa !important;
      }
    `;
    document.head.appendChild(style);
    styleInjectedRef.current = true;
  }, []);

  // Initialize and bind PlaceAutocompleteElement
  useEffect(() => {
    if (!placesLib || !containerRef.current || !hasValidKey) return;

    // 1. Create a <gmp-place-autocomplete> element imperatively to avoid React attribute issues
    const placeAutocomplete = new (google.maps.places as any).PlaceAutocompleteElement({
      placeholder: placeholder
    });

    // Styling the custom element
    placeAutocomplete.style.width = "100%";
    placeAutocomplete.style.border = "none";
    placeAutocomplete.style.background = "transparent";

    // Set custom properties for a unified color theme - FIXED TO BLACK
    const updateThemeStyles = () => {
      // Force the input text to black
      placeAutocomplete.style.setProperty("--gmpx-color-on-surface", "#000000", "important");
      placeAutocomplete.style.setProperty("--gmpx-color-surface", "#ffffff", "important");
      placeAutocomplete.style.setProperty("--gmpx-font-family-base", "Inter, system-ui, sans-serif");
      placeAutocomplete.style.setProperty("--gmpx-font-size-base", "14px");

      const shadowInput = placeAutocomplete.shadowRoot?.querySelector("input");
      if (shadowInput) {
        shadowInput.style.color = "#000000" + " !important";
        shadowInput.style.setProperty("color", "#000000", "important");
        shadowInput.style.backgroundColor = "transparent";
        shadowInput.style.border = "none";
        shadowInput.style.outline = "none";
        shadowInput.style.fontSize = "14px";
        shadowInput.style.padding = "10px 12px";
        shadowInput.style.width = "100%";
        shadowInput.style.fontFamily = "Inter, system-ui, sans-serif";
      }

      // Also try to style the input inside the shadow DOM
      const allInputs = placeAutocomplete.shadowRoot?.querySelectorAll("input");
      allInputs?.forEach((input: any) => {
        input.style.color = "#000000";
        input.style.setProperty("color", "#000000", "important");
      });
    };

    updateThemeStyles();

    // Observe theme changes to keep the text color updated dynamically
    const observer = new MutationObserver(updateThemeStyles);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Periodically retry styling the shadow input as it finishes mounting internally
    const styleInterval = setInterval(updateThemeStyles, 100);

    // Append custom component to container
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(placeAutocomplete);
    autocompleteRef.current = placeAutocomplete;

    // 3. Handle 'gmp-select' event to capture selected place
    const handleSelect = async (event: any) => {
      try {
        const placePrediction = event.placePrediction;
        const place = placePrediction ? placePrediction.toPlace() : (event.target.place || event.place);
        if (!place) return;

        // 4. Fetch details (tries explicit user fields first, then modern API fallback)
        try {
          await place.fetchFields({
            fields: ["addressComponents", "geometry.location"]
          });
        } catch (fetchErr) {
          console.warn("Retrying fetchFields with modern 'location' field...", fetchErr);
          await place.fetchFields({
            fields: ["addressComponents", "location", "formattedAddress"]
          });
        }

        const address = place.formattedAddress || place.displayName || "";
        
        // 5. Extract the geometry.location (latitude and longitude) and save
        let lat = 37.7749;
        let lng = -122.4194;

        if (place.geometry && place.geometry.location) {
          lat = typeof place.geometry.location.lat === "function" ? place.geometry.location.lat() : place.geometry.location.lat;
          lng = typeof place.geometry.location.lng === "function" ? place.geometry.location.lng() : place.geometry.location.lng;
        } else if (place.location) {
          lat = typeof place.location.lat === "function" ? place.location.lat() : place.location.lat;
          lng = typeof place.location.lng === "function" ? place.location.lng() : place.location.lng;
        }

        onChange(address, lat, lng);
      } catch (err) {
        console.error("Error inside gmp-select handler:", err);
      }
    };

    placeAutocomplete.addEventListener("gmp-select", handleSelect);

    return () => {
      placeAutocomplete.removeEventListener("gmp-select", handleSelect);
      observer.disconnect();
      clearInterval(styleInterval);
    };
  }, [placesLib, placeholder]);

  // Set values on the underlying input if it changes from parent (e.g. during Gemini analysis)
  useEffect(() => {
    if (autocompleteRef.current) {
      const shadowInput = autocompleteRef.current.shadowRoot?.querySelector("input");
      if (shadowInput) {
        shadowInput.value = value || "";
        // Force black color when value is set
        shadowInput.style.color = "#000000";
        shadowInput.style.setProperty("color", "#000000", "important");
      }
      autocompleteRef.current.value = value || "";
    }
  }, [value]);

  // Degrade gracefully to a standard text input if Places library hasn't loaded or Key is invalid
  if (!placesLib || !hasValidKey) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-black rounded-lg border border-slate-200 dark:border-slate-750 focus:outline-none focus:border-blue-500 transition-all text-sm placeholder-slate-400 dark:placeholder-slate-500 ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className={`relative w-full rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 focus-within:border-blue-500 transition-all p-0.5`}>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}