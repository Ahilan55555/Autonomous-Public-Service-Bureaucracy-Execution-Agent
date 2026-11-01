import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  UserRound,
  LogOut,
  Menu,
  X,
  FileText,
  Sparkles,
  Bell,
  ClipboardList,
  MessageSquare,
  Send,
  RefreshCw,
  FolderCheck,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Search,
  Wifi,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { agentApi, healthApi, servicesApi } from "../api/services";
import { getCategoryDisplayLabel, deduplicateSchemes } from "../api/normalize";
import BackendStatusModal from "../components/BackendStatusModal";
import EligibilityModal from "../components/EligibilityModal";
import ReadinessModal from "../components/ReadinessModal";
import ExecutionDraftModal from "../components/ExecutionDraftModal";
import Toast from "../components/Toast";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const aiSectionRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 850 : true));
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState(null);

  // User-discovered schemes from GET /api/services/my-services
  const [discoveredSchemes, setDiscoveredSchemes] = useState([]);
  const [loadingDiscovered, setLoadingDiscovered] = useState(false);
  const [deletingSchemeId, setDeletingSchemeId] = useState(null);
  const [toast, setToast] = useState(null);

  // Active Modals State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeEligibility, setActiveEligibility] = useState({ isOpen: false, serviceId: null, serviceName: "" });
  const [activeReadiness, setActiveReadiness] = useState({ isOpen: false, serviceId: null, serviceName: "" });
  const [activeExecutionDraft, setActiveExecutionDraft] = useState({ isOpen: false, serviceId: null, serviceName: "" });

  // Quick health indicator
  const [backendHealth, setBackendHealth] = useState("checking");

  // Chat message history including AI pipeline structured cards
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "Hello! 👋 I'm your CivicEase Autonomous Agent. How can I help you discover and apply for public services today?",
    },
  ]);

  const userId = (typeof localStorage !== "undefined" && localStorage.getItem("user_id")) || "guest";
  const profileRaw =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem(`citizenProfile_${userId}`) || localStorage.getItem("citizenProfile"))) ||
    "{}";
  const profile = JSON.parse(profileRaw);

  const name =
    profile.full_name ||
    profile.fullName ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("signup_name") ||
    "Citizen";

  const firstName = name.split(" ")[0];

  async function loadDiscoveredSchemes() {
    setLoadingDiscovered(true);
    try {
      const data = await servicesApi.getMyServices();
      setDiscoveredSchemes(deduplicateSchemes(data));
    } catch {
      // Backend may be offline or empty
    } finally {
      setLoadingDiscovered(false);
    }
  }

  async function handleDeleteScheme(serviceId, serviceName) {
    if (deletingSchemeId) return;
    setDeletingSchemeId(serviceId);
    try {
      await servicesApi.deleteUserScheme(serviceId);
      setDiscoveredSchemes((prev) => prev.filter((s) => s.id !== serviceId && s.service_code !== serviceId));
      setChatMessages((prev) =>
        prev.map((msg) => {
          if (!msg.matched_schemes) return msg;
          return {
            ...msg,
            matched_schemes: msg.matched_schemes.filter((s) => s.id !== serviceId && s.service_code !== serviceId),
          };
        })
      );
      setToast({
        message: `"${serviceName || "Scheme"}" removed from your discovered schemes.`,
        type: "success",
      });
    } catch (err) {
      setToast({
        message: err.message || "Failed to dismiss scheme.",
        type: "error",
      });
    } finally {
      setDeletingSchemeId(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    function check() {
      healthApi
        .checkHealth()
        .then((res) => {
          if (mounted && (res?.status === "online" || res?.status === "ok" || res?.status === "healthy")) {
            setBackendHealth("online");
          } else if (mounted) {
            setBackendHealth("offline");
          }
        })
        .catch(() => {
          if (mounted) setBackendHealth("offline");
        });
    }

    check();
    loadDiscoveredSchemes();

    function onSchemeDeleted(e) {
      const deletedId = e.detail?.serviceId;
      if (deletedId) {
        setDiscoveredSchemes((prev) => prev.filter((s) => s.id !== deletedId));
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("civic_api_base_url_changed", check);
      window.addEventListener("civic_user_scheme_deleted", onSchemeDeleted);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("civic_api_base_url_changed", check);
        window.removeEventListener("civic_user_scheme_deleted", onSchemeDeleted);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (location.state?.scrollTo) {
      navigateToSection(location.state.scrollTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function handleLogout() {
    const currentUserId = localStorage.getItem("user_id");
    localStorage.removeItem("access_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("citizenProfile");
    if (currentUserId) {
      localStorage.removeItem(`citizenProfile_${currentUserId}`);
    }
    navigate("/login");
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function handleTalkToAi() {
    setActiveSection("AI Assistant");
    if (typeof window !== "undefined" && window.innerWidth <= 850) {
      setSidebarOpen(false);
    }

    if (chatInputRef.current) {
      chatInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      try {
        chatInputRef.current.focus({ preventScroll: true });
      } catch {
        chatInputRef.current.focus();
      }

      setTimeout(() => {
        if (chatInputRef.current) {
          try {
            chatInputRef.current.focus({ preventScroll: true });
          } catch {
            chatInputRef.current.focus();
          }
        }
      }, 400);
    } else if (aiSectionRef.current) {
      aiSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function navigateToSection(section) {
    if (section === "AI Assistant") {
      handleTalkToAi();
      return;
    }
    setActiveSection(section);
    if (typeof window !== "undefined" && window.innerWidth <= 850) {
      setSidebarOpen(false);
    }
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // Autonomous Agent Assistance Request
  async function handleSendMessage(messageText = chatInput) {
    const query = messageText ? messageText.trim() : "";
    if (!query || isTyping) return;

    setChatError(null);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: query,
      },
    ]);
    setChatInput("");
    setIsTyping(true);

    try {
      const agentRes = await agentApi.assist(query);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: agentRes.understood_intent?.summary || "Here is what I found based on your request:",
          understood_intent: agentRes.understood_intent,
          matched_schemes: agentRes.matched_schemes || [],
          citizen_state: agentRes.citizen_state,
        },
      ]);

      if (agentRes.matched_schemes && agentRes.matched_schemes.length > 0) {
        loadDiscoveredSchemes();
      }
    } catch (err) {
      setChatError(err.message || "Unable to reach autonomous assistance agent.");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ I encountered an error while processing your request: ${err.message || "Network error"}. Please make sure the backend is connected.`,
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
      <aside
        className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}
      >
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

        <p
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#999",
            letterSpacing: "1px",
            margin: "25px 0 10px 10px",
          }}
        >
          MENU
        </p>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeSection === "Dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("Dashboard");
              if (typeof window !== "undefined" && window.innerWidth <= 850) {
                setSidebarOpen(false);
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

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

      {/* MAIN CONTENT */}
      <main
        className="main-content"
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          height: "100vh",
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
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Your personal public service assistant</p>
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
                borderColor: backendHealth === "online" ? "#a5efbd" : "#fecaca",
                background: backendHealth === "online" ? "#f0fff4" : "#fff5f5",
                color: backendHealth === "online" ? "#235a34" : "#b91c1c",
                fontSize: "12px",
                fontWeight: "750",
                cursor: "pointer",
              }}
            >
              <Wifi size={14} color={backendHealth === "online" ? "#367c4b" : "#dc2626"} />
              <span className="backend-btn-text">Backend: </span>{backendHealth === "online" ? "Online" : backendHealth === "checking" ? "Checking" : "Offline"}
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
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* WELCOME SECTION */}
        <section
          className="welcome-banner"
          style={{
            background: "#c7ffd8",
            borderRadius: "16px",
            padding: "35px",
            marginBottom: "30px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1px",
                marginBottom: "15px",
                color: "#367c4b",
              }}
            >
              <Sparkles size={15} />
              AUTONOMOUS CIVIC EXECUTION AGENT
            </div>

            <h2
              style={{
                fontSize: "clamp(25px, 3vw, 38px)",
                fontWeight: "800",
                letterSpacing: "-1px",
                marginBottom: "15px",
              }}
            >
              Hello, {firstName}! 👋
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: "#354b3b",
                lineHeight: "1.8",
                maxWidth: "540px",
                marginBottom: "25px",
              }}
            >
              Welcome to CivicEase. Ask about scholarships, government schemes, or subsidies.
              Our agent will understand your request, evaluate your eligibility, inspect your document vault,
              and prepare your execution manifest.
            </p>

            <button
              id="talk-to-ai-btn"
              type="button"
              onClick={handleTalkToAi}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "13px 20px",
                border: "none",
                borderRadius: "9px",
                background: "#111",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <MessageSquare size={16} />
              Talk to AI Assistant
            </button>
          </div>
        </section>

        {/* AI ASSISTANT PIPELINE SECTION */}
        <section id="AI Assistant" ref={aiSectionRef} style={{ marginBottom: "35px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#c7ffd8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={21} color="#367c4b" />
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                Autonomous Public Service Agent
              </h2>
              <p style={{ fontSize: "13px", color: "#777", marginTop: "5px" }}>
                State-aware intent classification, scheme matching, and eligibility engine
              </p>
            </div>
          </div>

          {/* CHAT BOX */}
          <div className="dashboard-card" style={{ padding: "24px" }}>
            <div
              style={{
                maxHeight: "550px",
                overflowY: "auto",
                marginBottom: "18px",
              }}
            >
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className="chat-animated-message"
                  style={{
                    display: "flex",
                    justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: message.sender === "user" ? "75%" : "100%",
                      width: message.matched_schemes ? "100%" : "auto",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      background: message.sender === "user" ? "#c7ffd8" : "#f5f7f5",
                      color: "#222",
                      fontSize: "13px",
                      lineHeight: "1.7",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-line" }}>{message.text}</div>

                    {/* Understood Intent Box */}
                    {message.understood_intent && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "14px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          border: "1px solid #e5e7e5",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#367c4b",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Sparkles size={14} /> UNDERSTOOD INTENT
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: "#e8fff0",
                              color: "#16803c",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            Category: {message.understood_intent.service_category || "General"}
                          </span>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: "#f0f4ff",
                              color: "#2563eb",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            User: {message.understood_intent.user_type || "Citizen"}
                          </span>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: "#fdf2f8",
                              color: "#db2777",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            Action: {message.understood_intent.required_action || "Assistance"}
                          </span>
                        </div>

                        {message.understood_intent.missing_information &&
                          message.understood_intent.missing_information.length > 0 && (
                            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "6px" }}>
                              <b>Missing details:</b>{" "}
                              {message.understood_intent.missing_information.join(", ")}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Matched Schemes List */}
                    {message.matched_schemes && message.matched_schemes.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "800",
                            marginBottom: "12px",
                            color: "#111",
                          }}
                        >
                          Matched Schemes & Eligibility Breakdown ({message.matched_schemes.length}):
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          {message.matched_schemes.map((scheme) => {
                            const isEligible = scheme.eligibility?.is_eligible;

                            return (
                              <div
                                key={scheme.id || scheme.service_code}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e5e7e5",
                                  borderRadius: "12px",
                                  padding: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                      <span
                                        style={{
                                          padding: "3px 8px",
                                          borderRadius: "6px",
                                          background: "#e8fff0",
                                          color: "#16803c",
                                          fontSize: "10px",
                                          fontWeight: "800",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        {getCategoryDisplayLabel(scheme.category)}
                                      </span>
                                      {scheme.portal_url && (
                                        <a
                                          href={scheme.portal_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                            fontSize: "11px",
                                            color: "#2563eb",
                                            textDecoration: "none",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Official Portal <ExternalLink size={11} />
                                        </a>
                                      )}
                                    </div>
                                    <h4
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: "800",
                                        margin: "6px 0 4px",
                                      }}
                                    >
                                      {scheme.name}
                                    </h4>
                                  </div>

                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "4px 10px",
                                      borderRadius: "14px",
                                      fontSize: "11px",
                                      fontWeight: "800",
                                      background: isEligible ? "#c7ffd8" : "#fee2e2",
                                      color: isEligible ? "#16803c" : "#b91c1c",
                                    }}
                                  >
                                    {isEligible ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                    {isEligible ? "ELIGIBLE" : "INELIGIBLE"}
                                  </span>
                                </div>

                                <p style={{ fontSize: "12px", color: "#666", margin: "0 0 12px", lineHeight: "1.6" }}>
                                  {scheme.description}
                                </p>

                                {Array.isArray(scheme.capabilities) && scheme.capabilities.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "0 0 12px" }}>
                                    {scheme.capabilities.map((cap, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          padding: "2px 8px",
                                          borderRadius: "12px",
                                          background: "#f0fdf4",
                                          color: "#166534",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        ✦ {cap}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Next Action Instructions from Pipeline */}
                                {scheme.eligibility?.next_action_instructions && (
                                  <div
                                    style={{
                                      padding: "10px 12px",
                                      borderRadius: "8px",
                                      background: "#f7f9f7",
                                      border: "1px solid #e5e7e5",
                                      fontSize: "12px",
                                      color: "#333",
                                      marginBottom: "12px",
                                    }}
                                  >
                                    <b>Agent Instructions:</b> {scheme.eligibility.next_action_instructions}
                                  </div>
                                )}

                                {/* Missing Profile Data Alert */}
                                {scheme.eligibility?.missing_profile_data &&
                                  scheme.eligibility.missing_profile_data.length > 0 && (
                                    <div
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        background: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        fontSize: "12px",
                                        color: "#92400e",
                                        marginBottom: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span>
                                        Missing profile data:{" "}
                                        <b>{scheme.eligibility.missing_profile_data.join(", ")}</b>
                                      </span>
                                      <button
                                        onClick={() => navigate("/create-profile")}
                                        style={{
                                          padding: "4px 8px",
                                          borderRadius: "6px",
                                          background: "#111",
                                          color: "#fff",
                                          fontSize: "10px",
                                          fontWeight: "700",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Update Profile
                                      </button>
                                    </div>
                                  )}

                                {/* Criteria Breakdown */}
                                {scheme.eligibility?.evaluation_breakdown &&
                                  scheme.eligibility.evaluation_breakdown.length > 0 && (
                                    <div style={{ marginBottom: "12px" }}>
                                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#777", marginBottom: "6px" }}>
                                        CRITERIA EVALUATION:
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        {scheme.eligibility.evaluation_breakdown.map((item, idx) => (
                                          <div
                                            key={`${item.criterion}-${idx}`}
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              fontSize: "12px",
                                              padding: "4px 8px",
                                              background: "#fbfcfb",
                                              borderRadius: "6px",
                                            }}
                                          >
                                            <span>
                                              <b>{item.criterion}:</b> {item.remarks || `${item.actual} vs ${item.required}`}
                                            </span>
                                            <span style={{ fontWeight: "700", color: item.passed ? "#16803c" : "#dc2626" }}>
                                              {item.passed ? "✓ Passed" : "✗ Failed"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {/* Action Buttons */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                    paddingTop: "12px",
                                    borderTop: "1px solid #f0f0f0",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveEligibility({
                                        isOpen: true,
                                        serviceId: scheme.id,
                                        serviceName: scheme.name,
                                      })
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      border: "1px solid #c7ffd8",
                                      background: "#e8fff0",
                                      color: "#16803c",
                                      fontSize: "11px",
                                      fontWeight: "750",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <ShieldCheck size={13} />
                                    Full Eligibility
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveReadiness({
                                        isOpen: true,
                                        serviceId: scheme.id,
                                        serviceName: scheme.name,
                                      })
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      border: "1px solid #ddd",
                                      background: "#fff",
                                      color: "#333",
                                      fontSize: "11px",
                                      fontWeight: "750",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <FolderCheck size={13} />
                                    Document Readiness
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveExecutionDraft({
                                        isOpen: true,
                                        serviceId: scheme.id,
                                        serviceName: scheme.name,
                                      })
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      border: "none",
                                      background: "#111",
                                      color: "#fff",
                                      fontSize: "11px",
                                      fontWeight: "750",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <FileCheck2 size={13} />
                                    Execution Draft
                                  </button>

                                  <button
                                    type="button"
                                    disabled={deletingSchemeId === scheme.id}
                                    onClick={() => handleDeleteScheme(scheme.id, scheme.name)}
                                    title="Remove this scheme from your discovered list"
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      border: "1px solid #fee2e2",
                                      background: "#fff5f5",
                                      color: "#dc2626",
                                      fontSize: "11px",
                                      fontWeight: "750",
                                      cursor: deletingSchemeId === scheme.id ? "not-allowed" : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      marginLeft: "auto",
                                      opacity: deletingSchemeId === scheme.id ? 0.6 : 1,
                                    }}
                                  >
                                    {deletingSchemeId === scheme.id ? (
                                      <>
                                        <RefreshCw size={13} className="spin-animation" />
                                        Dismissing...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 size={13} />
                                        Dismiss
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* AI TYPING ANIMATION */}
              {isTyping && (
                <div
                  className="chat-animated-message"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#f5f7f5",
                    width: "fit-content",
                  }}
                >
                  <div className="ai-typing-indicator" style={{ display: "inline-flex" }}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>
                    Analyzing civic intent & evaluating scheme criteria (LLM matching)...
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid #e5e7e5",
                borderRadius: "10px",
                padding: "8px 12px",
                background: "#fff",
              }}
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  isTyping
                    ? "Autonomous agent is evaluating schemes..."
                    : "Describe what you need (e.g. undergraduate scholarships, farmer subsidies, driving license)..."
                }
                disabled={isTyping}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "8px",
                  fontSize: "13px",
                  background: "transparent",
                }}
              />

              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#111",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isTyping || !chatInput.trim() ? 0.5 : 1,
                  cursor: isTyping ? "not-allowed" : "pointer",
                }}
              >
                {isTyping ? <RefreshCw size={16} className="spin-animation" /> : <Send size={16} />}
              </button>
            </form>

            {chatError && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#dc2626" }}>
                {chatError}
              </div>
            )}

            <p
              style={{
                fontSize: "11px",
                color: "#43885a",
                marginTop: "12px",
              }}
            >
              <ShieldCheck
                size={12}
                style={{
                  verticalAlign: "middle",
                  marginRight: "5px",
                }}
              />
              Protected citizen pipeline &bull; Authenticated Bearer dispatch
            </p>
          </div>


        </section>

        {/* YOUR DISCOVERED SCHEMES */}
        {discoveredSchemes.length > 0 && (
          <section id="Discovered Schemes" style={{ marginBottom: "35px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#111", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  Your Discovered Schemes ({discoveredSchemes.length})
                  {loadingDiscovered && <RefreshCw size={14} className="spin-animation" color="#367c4b" />}
                </h3>
                <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>
                  Schemes associated with your citizen profile and assistance sessions
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/schemes-catalog")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16803c",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                View Catalog &amp; Filters &rarr;
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {discoveredSchemes.slice(0, 6).map((scheme) => (
                <div
                  key={scheme.id || scheme.service_code}
                  className="dashboard-card"
                  style={{
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#e8fff0",
                          color: "#16803c",
                          fontSize: "10px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                        }}
                      >
                        {getCategoryDisplayLabel(scheme.category)}
                      </span>
                      <button
                        type="button"
                        disabled={deletingSchemeId === scheme.id}
                        onClick={() => handleDeleteScheme(scheme.id, scheme.name)}
                        title="Dismiss scheme"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#dc2626",
                          cursor: deletingSchemeId === scheme.id ? "not-allowed" : "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                        }}
                      >
                        {deletingSchemeId === scheme.id ? (
                          <RefreshCw size={14} className="spin-animation" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>

                    <h4 style={{ fontSize: "15px", fontWeight: "800", margin: "0 0 6px", color: "#111" }}>
                      {scheme.name}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#666", margin: "0 0 12px", lineHeight: "1.5" }}>
                      {scheme.description}
                    </p>

                    {Array.isArray(scheme.capabilities) && scheme.capabilities.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                        {scheme.capabilities.map((cap, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "#f0fdf4",
                              color: "#166534",
                              fontSize: "10px",
                              fontWeight: "600",
                            }}
                          >
                            ✦ {cap}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      paddingTop: "12px",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEligibility({
                          isOpen: true,
                          serviceId: scheme.id,
                          serviceName: scheme.name,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #c7ffd8",
                        background: "#e8fff0",
                        color: "#16803c",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <ShieldCheck size={12} /> Eligibility
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReadiness({
                          isOpen: true,
                          serviceId: scheme.id,
                          serviceName: scheme.name,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        background: "#fff",
                        color: "#333",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <FolderCheck size={12} /> Vault
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveExecutionDraft({
                          isOpen: true,
                          serviceId: scheme.id,
                          serviceName: scheme.name,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#111",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <FileCheck2 size={12} /> Draft
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          style={{
            padding: "25px 0",
            borderTop: "1px solid #e5e7e5",
            color: "#999",
            fontSize: "12px",
          }}
        >
          © 2026 CivicEase · Making public services accessible to every citizen.
        </footer>
      </main>

      {/* ALL INTERACTIVE MODALS */}
      <BackendStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />

      <EligibilityModal
        isOpen={activeEligibility.isOpen}
        serviceId={activeEligibility.serviceId}
        serviceName={activeEligibility.serviceName}
        onClose={() => setActiveEligibility({ isOpen: false, serviceId: null, serviceName: "" })}
        onNavigateProfile={() => {
          setActiveEligibility({ isOpen: false, serviceId: null, serviceName: "" });
          navigate("/my-profile");
        }}
      />

      <ReadinessModal
        isOpen={activeReadiness.isOpen}
        serviceId={activeReadiness.serviceId}
        serviceName={activeReadiness.serviceName}
        onClose={() => setActiveReadiness({ isOpen: false, serviceId: null, serviceName: "" })}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Home;