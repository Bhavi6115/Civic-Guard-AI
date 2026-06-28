export interface Issue {
  id: number;
  category: string; // e.g., "pothole" | "broken_streetlight" | "garbage" | "water_leak" | "other"
  severity: "Low" | "Medium" | "High";
  description: string;
  location: string;
  status: "Reported" | "Under Review" | "In Progress" | "Resolved";
  date: string;
  image: string | null; // Base64 data URL
  lat: number;
  lng: number;
}

export interface DashboardStats {
  total: number;
  resolved: number;
  pending: number;
}
