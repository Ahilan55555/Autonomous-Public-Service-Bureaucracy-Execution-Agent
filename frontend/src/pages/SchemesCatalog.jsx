import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  UserRound,
  LogOut,
  Menu,
  X,
  FileText,
  ClipboardList,
  FolderCheck,
  Search,
  Bell,
  Wifi,
} from "lucide-react";

import { healthApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import EligibilityModal from "../components/EligibilityModal";
import ReadinessModal from "../components/ReadinessModal";
import ExecutionDraftModal from "../components/ExecutionDraftModal";
import ServicesList from "../components/ServicesList";
import "../App.css";

export default function SchemesCatalog() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 850 : true));
  const [profile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("citizenProfile") || "{}");
    } catch {
      return {};
    }
  });

  const userName = profile.full_name || localStorage.getItem("user_name") || "Citizen";
  const [backendOnline, setBackendOnline] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Modals for actions triggered from scheme cards
  const [activeEligibility, setActiveEligibility] = useState({ isOpen: false, serviceId: null, serviceName: "" });
  const [activeReadiness, setActiveReadiness] = useState({ isOpen: false, serviceId: null, serviceName: "" });
  const [activeExecutionDraft, setActiveExecutionDraft] = useState({ isOpen: false, serviceId: null, serviceName: "" });

  useEffect(() => {
    let isMounted = true;
    healthApi.checkHealth().then((res) => {
      if (isMounted) {
        setBackendOnline(res.status === "ok");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("citizenProfile");
    navigate("/login");
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  return (
    <div className="dashboard">
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="sidebar-brand-icon">
              <ShieldCheck size={22} />
            </div>
            CivicEase
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/home"
            className="sidebar-link"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>

          <NavLink
            to="/schemes-catalog"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <FileText size={19} />
            Schemes Catalog
          </NavLink>

          <NavLink
            to="/search-discovery"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <Search size={19} />
            Search & Discovery
          </NavLink>

          <NavLink
            to="/document-vault"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <FolderCheck size={19} />
            Document Vault
          </NavLink>

          <NavLink
            to="/my-applications"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <ClipboardList size={19} />
            My Applications
          </NavLink>
        </nav>

        <p
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#999",
            letterSpacing: "1px",
            margin: "25px 0 10px 10px",
          }}
        >
          ACCOUNT
        </p>

        <nav className="sidebar-nav">
          <NavLink
            to="/my-profile"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
            }}
          >
            <UserRound size={19} />
            My Profile
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-logout"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
              handleLogout();
            }}
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        className="main-content"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="mobile-menu"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div>
              <h1 className="dashboard-title">Discovered Schemes</h1>
              <p className="dashboard-subtitle">
                Official public services and schemes discovered for your citizen profile
              </p>
            </div>
          </div>

          <div className="dashboard-user">
            {/* Backend Connectivity Badge */}
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              title="Click to configure backend IP / LAN settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 12px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: backendOnline ? "#a5efbd" : "#fecaca",
                background: backendOnline ? "#f0fff4" : "#fff5f5",
                color: backendOnline ? "#235a34" : "#b91c1c",
                fontSize: "12px",
                fontWeight: "750",
                cursor: "pointer",
              }}
            >
              <Wifi size={14} color={backendOnline ? "#367c4b" : "#dc2626"} />
              <span className="backend-btn-text">Backend: </span>{backendOnline ? "Online" : "Offline"}
            </button>

            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#555",
                cursor: "pointer",
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <div
              className="dashboard-avatar"
              onClick={() => navigate("/my-profile")}
              style={{ cursor: "pointer" }}
              title="View Profile"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div style={{ padding: "30px" }}>
          <ServicesList
            onCheckEligibility={(id, name) => setActiveEligibility({ isOpen: true, serviceId: id, serviceName: name })}
            onCheckReadiness={(id, name) => setActiveReadiness({ isOpen: true, serviceId: id, serviceName: name })}
            onCreateDraft={(id, name) => setActiveExecutionDraft({ isOpen: true, serviceId: id, serviceName: name })}
          />
        </div>
      </main>

      {/* MODALS */}
      <BackendStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        initialStatus={backendOnline}
        onStatusChange={(isOnline) => setBackendOnline(isOnline)}
      />

      <EligibilityModal
        isOpen={activeEligibility.isOpen}
        serviceId={activeEligibility.serviceId}
        serviceName={activeEligibility.serviceName}
        onClose={() => setActiveEligibility({ isOpen: false, serviceId: null, serviceName: "" })}
        onProceedToReadiness={(id, name) => {
          setActiveEligibility({ isOpen: false, serviceId: null, serviceName: "" });
          setActiveReadiness({ isOpen: true, serviceId: id, serviceName: name });
        }}
      />

      <ReadinessModal
        isOpen={activeReadiness.isOpen}
        serviceId={activeReadiness.serviceId}
        serviceName={activeReadiness.serviceName}
        onClose={() => setActiveReadiness({ isOpen: false, serviceId: null, serviceName: "" })}
        onProceedToDraft={(id, name) => {
          setActiveReadiness({ isOpen: false, serviceId: null, serviceName: "" });
          setActiveExecutionDraft({ isOpen: true, serviceId: id, serviceName: name });
        }}
        onNavigateVault={() => {
          setActiveReadiness({ isOpen: false, serviceId: null, serviceName: "" });
          navigate("/document-vault");
        }}
      />

      <ExecutionDraftModal
        isOpen={activeExecutionDraft.isOpen}
        serviceId={activeExecutionDraft.serviceId}
        serviceName={activeExecutionDraft.serviceName}
        onClose={() => setActiveExecutionDraft({ isOpen: false, serviceId: null, serviceName: "" })}
        onNavigateProfile={() => {
          setActiveExecutionDraft({ isOpen: false, serviceId: null, serviceName: "" });
          navigate("/my-profile");
        }}
        onNavigateVault={() => {
          setActiveExecutionDraft({ isOpen: false, serviceId: null, serviceName: "" });
          navigate("/document-vault");
        }}
      />
    </div>
  );
}
