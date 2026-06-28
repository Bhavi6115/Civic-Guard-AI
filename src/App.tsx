import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Sun,
  Moon,
  Trash2,
  Tag,
  ChevronsUpDown,
  Filter,
  Calendar,
  AlertCircle,
  Search,
  Sparkles,
  RefreshCw,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import IssueMap from "./components/IssueMap";
import ReportModal from "./components/ReportModal";
import { Issue, DashboardStats } from "./types";
import { APIProvider } from "@vis.gl/react-google-maps";
import { saveIssue, getIssues, updateIssueStatus, deleteIssue } from "./firebase";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.REACT_APP_MAPS_API_KEY ||
  "";

const INITIAL_ISSUES: Issue[] = [
  {
    id: 1,
    category: "broken_streetlight",
    severity: "Medium",
    description: "Non-functioning municipal street light causing dark safety hazards",
    location: "120 Main St, Downtown SF",
    status: "Reported",
    date: "2026-06-27T04:26:00",
    image: null,
    lat: 37.7946,
    lng: -122.3999,
    firebaseId: ""
  },
  {
    id: 2,
    category: "garbage",
    severity: "Medium",
    description: "Illegal dumping of mattresses and large household items blocking the path",
    location: "Presidio Trail Entrance, Sector B",
    status: "Under Review",
    date: "2026-06-27T04:24:00",
    image: null,
    lat: 37.7989,
    lng: -122.4662,
    firebaseId: ""
  },
  {
    id: 3,
    category: "pothole",
    severity: "High",
    description: "Massive 2-foot deep pothole in middle of residential road",
    location: "742 Evergreen Terrace, Springfield",
    status: "Resolved",
    date: "2026-06-25T04:24:00",
    image: null,
    lat: 37.7749,
    lng: -122.4194,
    firebaseId: ""
  }
];

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [statusMenuOpen, setStatusMenuOpen] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Load issues from Firebase on mount
  useEffect(() => {
    async function loadIssues() {
      try {
        setIsLoading(true);
        const fetchedIssues = await getIssues();
        if (fetchedIssues && fetchedIssues.length > 0) {
          setIssues(fetchedIssues as Issue[]);
        } else {
          setIssues(INITIAL_ISSUES);
          for (const issue of INITIAL_ISSUES) {
            await saveIssue(issue);
          }
        }
      } catch (error) {
        console.error("Error loading issues:", error);
        setIssues(INITIAL_ISSUES);
      } finally {
        setIsLoading(false);
      }
    }
    loadIssues();
  }, []);

  // Load and apply theme on launch
  useEffect(() => {
    const savedTheme = localStorage.getItem("reporter_theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reporter_theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Toast helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Stats calculation
  const stats: DashboardStats = {
    total: issues.length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
    pending: issues.filter((i) => i.status !== "Resolved").length
  };

  // Severity data for Doughnut chart
  const severityData = [
    { name: "Low Severity", value: issues.filter((i) => i.severity === "Low").length, color: "#10b981" },
    { name: "Medium Severity", value: issues.filter((i) => i.severity === "Medium").length, color: "#f59e0b" },
    { name: "High Severity", value: issues.filter((i) => i.severity === "High").length, color: "#ef4444" }
  ];

  // Handles adding new issue from ReportModal
  const handleAddNewIssue = async (newIssueData: {
    category: string;
    severity: "Low" | "Medium" | "High";
    description: string;
    location: string;
    image: string | null;
    lat: number;
    lng: number;
  }) => {
    const newIssue: Issue = {
      id: Date.now(),
      category: newIssueData.category,
      severity: newIssueData.severity,
      description: newIssueData.description,
      location: newIssueData.location,
      status: "Reported",
      date: new Date().toISOString(),
      image: newIssueData.image,
      lat: newIssueData.lat,
      lng: newIssueData.lng,
      firebaseId: ""
    };

    try {
      const docId = await saveIssue(newIssue);
      const issueWithId = { ...newIssue, firebaseId: docId };
      setIssues((prev) => [issueWithId as unknown as Issue, ...prev]);
      showToast("Community issue successfully logged & analyzed by Gemini!", "success");
    } catch (error) {
      console.error("Error saving issue:", error);
      showToast("Failed to save issue. Please try again.", "error");
    }
  };

  // Handles status change
  const handleStatusChange = async (id: number, newStatus: Issue["status"]) => {
    try {
      const issueToUpdate = issues.find((issue) => issue.id === id);
      if (issueToUpdate && issueToUpdate.firebaseId) {
        await updateIssueStatus(issueToUpdate.firebaseId, newStatus);
      }
      setIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, status: newStatus } : issue))
      );
      setStatusMenuOpen(null);
      showToast(`Status updated to: ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status. Please try again.", "error");
    }
  };

  // Handles deleting issue
  const handleDeleteIssue = async (id: number) => {
    try {
      const issueToDelete = issues.find((issue) => issue.id === id);
      if (issueToDelete && issueToDelete.firebaseId) {
        await deleteIssue(issueToDelete.firebaseId);
      }
      setIssues((prev) => prev.filter((i) => i.id !== id));
      showToast("Report successfully removed", "info");
    } catch (error) {
      console.error("Error deleting issue:", error);
      showToast("Failed to delete issue. Please try again.", "error");
    }
  };

  // Filtered Issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "broken_streetlight":
        return "Broken Streetlight";
      case "water_leak":
        return "Water Leak";
      case "pothole":
      case "potholes":
        return "Pothole";
      case "garbage":
        return "Garbage Dumping";
      default:
        return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-800/50";
      case "In Progress":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/25 dark:text-orange-400 dark:border-orange-800/50";
      case "Under Review":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/25 dark:text-blue-405 dark:border-blue-800/50";
      case "Reported":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-800/50";
    }
  };

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-800/50";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-800/50";
      case "Low":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/60";
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-16">
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white dark:bg-slate-900 ${
                toast.type === "success"
                  ? "border-emerald-100 dark:border-emerald-900/40 shadow-emerald-50 dark:shadow-none"
                  : toast.type === "error"
                  ? "border-rose-100 dark:border-rose-900/40 shadow-rose-50 dark:shadow-none"
                  : "border-blue-100 dark:border-blue-900/40 shadow-blue-50 dark:shadow-none"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Update"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Hero Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                CivicGuard <span className="text-blue-600">AI</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                Community Hub
              </p>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                statusFilter === "all" && categoryFilter === "all" && searchQuery === ""
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setStatusFilter("Resolved");
                setCategoryFilter("all");
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                statusFilter === "Resolved"
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              History
            </button>
            <button
              onClick={() => {
                const mapSec = document.getElementById("interactive-map");
                if (mapSec) {
                  mapSec.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="px-4 py-1.5 rounded-md text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Live Map
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer min-h-[40px] min-w-[40px] border border-slate-200 dark:border-slate-800"
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all min-h-[40px] cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Report an Issue</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        <section id="interactive-map" className="space-y-3 scroll-mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Live Interactive Map
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Showing all reported issue pins</p>
          </div>
          <IssueMap issues={issues} />
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                Severity Breakdown
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Visual analysis of reported issues by urgency level
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-wrap justify-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-300">Low ({severityData[0].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600 dark:text-slate-300">Medium ({severityData[1].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 dark:text-slate-300">High ({severityData[2].value})</span>
              </div>
            </div>
          </div>

          <div className="h-44 mt-6 relative flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                      borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: theme === "dark" ? "#f1f5f9" : "#0f172a",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500 text-xs">
                No issue reports available to display chart analysis.
              </div>
            )}
            {stats.total > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {stats.total}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Reports
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Reports</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{stats.total}</h3>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500 flex items-center justify-between relative overflow-hidden transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resolved</p>
              <h3 className="text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.resolved}</h3>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-500 flex items-center justify-between relative overflow-hidden transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending Review</p>
              <h3 className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.pending}</h3>
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search issues description, address, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs transition-all placeholder:text-slate-400 shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mr-2">
                  <Filter className="w-3.5 h-3.5" />
                  Filters:
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none cursor-pointer min-h-[38px] hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <option value="all">All Categories</option>
                  <option value="pothole">Pothole</option>
                  <option value="broken_streetlight">Streetlight</option>
                  <option value="garbage">Garbage</option>
                  <option value="water_leak">Water Leak</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none cursor-pointer min-h-[38px] hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <option value="all">All Severities</option>
                  <option value="Low">Low Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="High">High Severity</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none cursor-pointer min-h-[38px] hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                {(categoryFilter !== "all" || severityFilter !== "all" || statusFilter !== "all" || searchQuery !== "") && (
                  <button
                    onClick={() => {
                      setCategoryFilter("all");
                      setSeverityFilter("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Reported Issues Logs ({filteredIssues.length})
            </h2>
            <div className="text-[11px] text-slate-400">Sorted by Date (Newest first)</div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredIssues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-3 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-350 dark:text-slate-550 flex items-center justify-center text-xl">
                  🔍
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No issues found</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                  Try adjusting your filters or search criteria, or report a new community issue to see it here.
                </p>
              </motion.div>
            ) : (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                {filteredIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    layoutId={`issue-card-${issue.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group relative"
                  >
                    {issue.image ? (
                      <div className="h-44 overflow-hidden relative border-b border-slate-200 dark:border-slate-800">
                        <img
                          src={issue.image}
                          alt={issue.category}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          AI Verified Image
                        </div>
                      </div>
                    ) : (
                      <div className="h-44 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-lg mb-2">
                          🖼️
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">No Image Uploaded</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-550 mt-0.5">Report submitted without visual reference</p>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider ${getSeverityBadgeStyles(issue.severity)}`}>
                            {issue.severity} Severity
                          </span>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-850 dark:text-white capitalize flex items-center gap-1.5 leading-snug">
                            {getCategoryLabel(issue.category)}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {issue.description}
                          </p>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-start gap-1.5 text-slate-550 dark:text-slate-400 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate font-medium" title={issue.location}>{issue.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px]">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{new Date(issue.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Status</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border mt-1 flex items-center gap-1 w-max ${getStatusBadgeStyles(issue.status)}`}>
                            {issue.status === "Resolved" && <CheckCircle2 className="w-3 h-3" />}
                            {issue.status}
                          </span>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusMenuOpen(statusMenuOpen === issue.id ? null : issue.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer min-h-[32px]"
                          >
                            <span>Update Status</span>
                            <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                          </button>

                          {statusMenuOpen === issue.id && (
                            <div className="absolute right-0 bottom-full mb-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden w-36 py-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                              {(["Reported", "Under Review", "In Progress", "Resolved"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(issue.id, st)}
                                  className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                                    issue.status === st
                                      ? "text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                                      : "text-slate-600 dark:text-slate-450"
                                  }`}
                                >
                                  <span>{st}</span>
                                  {issue.status === st && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddNewIssue}
      />
      </div>
    </APIProvider>
  );
}