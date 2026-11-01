import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  UserRound,
  LogOut,
  Menu,
  X,
  FileText,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  GraduationCap,
  Building2,
  IndianRupee,
  ArrowLeft,
  Pencil,
  Save,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Briefcase,
  BookOpen,
  Search,
  FolderCheck,
  ClipboardList,
  Bell,
} from "lucide-react";
import { apiClient } from "../api/client";
import "../App.css";
import { stateDistricts, indianStates } from "./CreateProfile";

function getTodayIso() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatToDisplayDob(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  const isoPart = str.split("T")[0];
  const parts = isoPart.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return str;
}

function formatToIsoDob(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const isoPart = str.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
    return isoPart;
  }
  return null;
}

function validateDobString(val, isRequired = false) {
  if (!val || typeof val !== "string" || !val.trim()) {
    return isRequired
      ? { valid: false, error: "Date of birth is required." }
      : { valid: true, error: null };
  }
  const str = val.trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return { valid: false, error: "Date of birth must be in DD/MM/YYYY format (e.g. 15/08/2005)." };
  }
  const [dStr, mStr, yStr] = str.split("/");
  const day = parseInt(dStr, 10);
  const month = parseInt(mStr, 10);
  const year = parseInt(yStr, 10);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) {
    return { valid: false, error: `Year must be between 1900 and ${currentYear}.` };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: "Month must be between 01 and 12." };
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `Invalid date. The selected month has only ${daysInMonth} days.` };
  }

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (birthDate > today) {
    return { valid: false, error: "Date of birth cannot be a future date." };
  }

  return { valid: true, error: null };
}

function calculateAgeFromDob(dobString) {
  if (!dobString) return "";
  let birth = null;
  const str = String(dobString).trim();
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        birth = new Date(year, month - 1, day);
      }
    }
  } else if (str.includes("-")) {
    const isoPart = str.split("T")[0];
    const parts = isoPart.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      birth = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    }
  } else {
    birth = new Date(str);
  }

  if (!birth || isNaN(birth.getTime())) return "";
  const today = new Date();
  let ageVal = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    ageVal--;
  }
  return ageVal >= 0 && ageVal <= 150 ? String(ageVal) : "";
}

function MyProfile() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 850 : true));
  const [isEditing, setIsEditing] = useState(false);
  const userId = localStorage.getItem("user_id");
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(() => !userId);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const datePickerRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    gender: "",
    age: "",
    dob: "",
    state: "",
    district: "",
    annual_family_income: "",
    phone_number: "",
    occupation_type: "student",
    // Student conditional fields
    education_level: "",
    institution_name: "",
    course_or_degree: "",
    // Worker conditional fields
    employment_type: "",
    industry_or_sector: "",
    employer_name: "",
    email: localStorage.getItem("user_email") || "",
  });

  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    let ignore = false;
    if (!userId) {
      return;
    }

    apiClient(`/api/profile/${userId}`, { method: "GET", requiresAuth: true })
      .then((data) => {
        if (!ignore && data) {
          const occType = data.occupation_type === "worker" ? "worker" : "student";
          const normalized = {
            full_name: data.full_name ?? "",
            gender: data.gender ?? "",
            age:
              data.age !== null && data.age !== undefined
                ? String(data.age)
                : (data.dob ? calculateAgeFromDob(data.dob) : ""),
            dob: formatToDisplayDob(data.dob),
            state: data.state ?? "",
            district: data.district ?? "",
            annual_family_income:
              data.annual_family_income !== null && data.annual_family_income !== undefined
                ? String(data.annual_family_income)
                : "",
            phone_number: data.phone_number ?? "",
            occupation_type: occType,
            education_level: data.education_level ?? "",
            institution_name: data.institution_name ?? "",
            course_or_degree: data.course_or_degree ?? "",
            employment_type: data.employment_type ?? "",
            industry_or_sector: data.industry_or_sector ?? "",
            employer_name: data.employer_name ?? "",
            email: localStorage.getItem("user_email") || "",
          };

          setFormData(normalized);
          setOriginalData(normalized);
          localStorage.setItem("citizenProfile", JSON.stringify(data));
          if (userId) {
            localStorage.setItem(`citizenProfile_${userId}`, JSON.stringify(data));
          }
          if (data.full_name) {
            localStorage.setItem("user_name", data.full_name);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || "Failed to load profile.");
          }
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  async function handleRetryLoad() {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await apiClient(`/api/profile/${userId}`, { method: "GET", requiresAuth: true });
      if (data) {
        const occType = data.occupation_type === "worker" ? "worker" : "student";
        const normalized = {
          full_name: data.full_name ?? "",
          gender: data.gender ?? "",
          age:
            data.age !== null && data.age !== undefined
              ? String(data.age)
              : (data.dob ? calculateAgeFromDob(data.dob) : ""),
          dob: formatToDisplayDob(data.dob),
          state: data.state ?? "",
          district: data.district ?? "",
          annual_family_income:
            data.annual_family_income !== null && data.annual_family_income !== undefined
              ? String(data.annual_family_income)
              : "",
          phone_number: data.phone_number ?? "",
          occupation_type: occType,
          education_level: data.education_level ?? "",
          institution_name: data.institution_name ?? "",
          course_or_degree: data.course_or_degree ?? "",
          employment_type: data.employment_type ?? "",
          industry_or_sector: data.industry_or_sector ?? "",
          employer_name: data.employer_name ?? "",
          email: localStorage.getItem("user_email") || "",
        };

        setFormData(normalized);
        setOriginalData(normalized);
        localStorage.setItem("citizenProfile", JSON.stringify(data));
        if (userId) {
          localStorage.setItem(`citizenProfile_${userId}`, JSON.stringify(data));
        }
        if (data.full_name) {
          localStorage.setItem("user_name", data.full_name);
        }
      }
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  }

  const states = indianStates;
  const districts = stateDistricts[formData.state] || [];

  const name =
    formData.full_name ||
    localStorage.getItem("user_name") ||
    "Citizen";

  const openCalendarPicker = () => {
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === "function") {
        datePickerRef.current.showPicker();
      } else {
        datePickerRef.current.focus();
        datePickerRef.current.click();
      }
    }
  };

  const handleDobChange = (e) => {
    const raw = e.target.value;
    if (!raw) {
      setFormData((prev) => ({ ...prev, dob: "" }));
      return;
    }

    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [y, m, d] = trimmed.split("T")[0].split("-");
      const formatted = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      setFormData((prev) => {
        const updated = { ...prev, dob: formatted };
        if (!prev.age) {
          const derived = calculateAgeFromDob(formatted);
          if (derived) updated.age = derived;
        }
        return updated;
      });
      return;
    }

    let cleaned = raw.replace(/[^0-9/]/g, "").slice(0, 10);
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (!cleaned.includes("/") && digitsOnly.length > 2) {
      if (digitsOnly.length <= 4) {
        cleaned = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
      } else {
        cleaned = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
      }
    }

    setFormData((prev) => {
      const updated = { ...prev, dob: cleaned };
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
        const derived = calculateAgeFromDob(cleaned);
        if (derived && !prev.age) {
          updated.age = derived;
        }
      }
      return updated;
    });
  };

  const handleCalendarDateSelect = (e) => {
    const isoVal = e.target.value;
    if (!isoVal) return;
    const formatted = formatToDisplayDob(isoVal);
    setFormData((prev) => {
      const updated = { ...prev, dob: formatted };
      const derived = calculateAgeFromDob(formatted);
      if (derived) {
        updated.age = derived;
      }
      return updated;
    });
  };

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "age") {
      // Strict whole-number enforcement: accept empty or digits only
      if (value === "" || /^[0-9]+$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          age: value,
        }));
      }
      return;
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
        ...(name === "state" ? { district: "" } : {}),
      };

      // If DOB is entered and age is not manually set, auto-derive age
      if (name === "dob" && value && !prev.age) {
        const derived = calculateAgeFromDob(value);
        if (derived) {
          updated.age = derived;
        }
      }

      return updated;
    });
  }

  function handleOccupationChange(newType) {
    setFormData((prev) => ({
      ...prev,
      occupation_type: newType === "worker" ? "worker" : "student",
    }));
  }

  function handleCancelEdit() {
    if (originalData) {
      setFormData({ ...originalData });
    }
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    if (!userId) return;

    if (!formData.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    // Validate DOB if provided
    if (formData.dob) {
      const dobValidation = validateDobString(formData.dob, false);
      if (!dobValidation.valid) {
        setError(dobValidation.error);
        return;
      }
    }

    // Validate age if provided
    let parsedAge = null;
    if (formData.age !== "" && formData.age !== undefined && formData.age !== null) {
      if (!/^[0-9]+$/.test(String(formData.age).trim())) {
        setError("Age must be a valid whole number (no decimals or negative values).");
        return;
      }
      const numAge = Number.parseInt(formData.age, 10);
      if (isNaN(numAge) || numAge < 0 || numAge > 150) {
        setError("Please enter a realistic age between 0 and 150.");
        return;
      }
      parsedAge = numAge;
    }

    if (!formData.phone_number || !/^[0-9]{10}$/.test(formData.phone_number.trim())) {
      setError("Please provide a valid 10-digit phone number.");
      return;
    }

    if (!formData.state) {
      setError("Please select your State / Union Territory.");
      return;
    }

    if (!formData.district) {
      setError("Please select your district.");
      return;
    }

    const numericIncome = Number(formData.annual_family_income);
    if (isNaN(numericIncome) || numericIncome < 0 || formData.annual_family_income === "") {
      setError("Please enter a valid annual family income as a number.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const isStudent = formData.occupation_type === "student";

    const submittedGender =
      formData.gender === "prefer_not_to_say"
        ? "other"
        : (formData.gender || null);

    const commonPayload = {
      full_name: formData.full_name.trim(),
      gender: submittedGender,
      age: parsedAge,
      dob: formData.dob ? formatToIsoDob(formData.dob) : null,
      state: formData.state,
      district: formData.district,
      phone_number: formData.phone_number.trim(),
      annual_family_income: numericIncome,
      occupation_type: isStudent ? "student" : "worker",
    };

    // Do NOT submit hidden fields: send student fields ONLY for student, worker fields ONLY for worker
    const payload = isStudent
      ? {
          ...commonPayload,
          education_level: formData.education_level || null,
          institution_name: formData.institution_name ? formData.institution_name.trim() : null,
          course_or_degree: formData.course_or_degree ? formData.course_or_degree.trim() : null,
        }
      : {
          ...commonPayload,
          employment_type: formData.employment_type ? formData.employment_type.trim() : null,
          industry_or_sector: formData.industry_or_sector ? formData.industry_or_sector.trim() : null,
          employer_name: formData.employer_name ? formData.employer_name.trim() : null,
        };

    try {
      const updated = await apiClient(`/api/profile/${userId}`, {
        method: "PUT",
        body: payload,
        requiresAuth: true,
      });

      const nextOcc = updated?.occupation_type === "worker" ? "worker" : "student";
      const nextNormalized = {
        full_name: updated?.full_name ?? formData.full_name,
        gender: updated?.gender ?? formData.gender ?? "",
        age:
          updated?.age !== null && updated?.age !== undefined
            ? String(updated.age)
            : (updated?.dob ? calculateAgeFromDob(updated.dob) : formData.age || ""),
        dob: formatToDisplayDob(updated?.dob ?? formData.dob),
        state: updated?.state ?? "",
        district: updated?.district ?? "",
        phone_number: updated?.phone_number ?? "",
        annual_family_income:
          updated?.annual_family_income !== null && updated?.annual_family_income !== undefined
            ? String(updated.annual_family_income)
            : "",
        occupation_type: nextOcc,
        education_level: updated?.education_level ?? "",
        institution_name: updated?.institution_name ?? "",
        course_or_degree: updated?.course_or_degree ?? "",
        employment_type: updated?.employment_type ?? "",
        industry_or_sector: updated?.industry_or_sector ?? "",
        employer_name: updated?.employer_name ?? "",
        email: localStorage.getItem("user_email") || "",
      };

      setFormData(nextNormalized);
      setOriginalData(nextNormalized);

      localStorage.setItem("citizenProfile", JSON.stringify(updated));
      if (userId) {
        localStorage.setItem(`citizenProfile_${userId}`, JSON.stringify(updated));
      }
      if (updated?.full_name) {
        localStorage.setItem("user_name", updated.full_name);
      }

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

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

  const genderDisplayMap = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
    transgender: "Transgender",
  };

  const commonDetails = [
    {
      label: "Full Name",
      value: formData.full_name || "Not provided",
      icon: UserRound,
      name: "full_name",
      editable: true,
    },
    {
      label: "Gender",
      value: formData.gender ? (genderDisplayMap[formData.gender] || formData.gender) : "Not provided",
      icon: UserRound,
      name: "gender",
      editable: true,
      isSelect: true,
      options: [
        { value: "", label: "Select gender" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
    },
    {
      label: "Age",
      value: formData.age ? `${formData.age} years` : "Not provided",
      icon: CalendarDays,
      name: "age",
      editable: true,
      type: "number",
      min: "0",
      max: "150",
      step: "1",
      placeholder: "e.g. 21",
    },
    {
      label: "Email Address",
      value: formData.email || localStorage.getItem("user_email") || "Not provided",
      icon: Mail,
      name: "email",
      editable: false,
    },
    {
      label: "Phone Number",
      value: formData.phone_number || "Not provided",
      icon: Phone,
      name: "phone_number",
      editable: true,
    },
    {
      label: "Date of Birth",
      value: formatToDisplayDob(formData.dob) || "Not provided",
      icon: CalendarDays,
      name: "dob",
      editable: true,
    },
    {
      label: "State / Union Territory",
      value: formData.state || "Not provided",
      icon: MapPin,
      name: "state",
      editable: true,
      isSelect: true,
      options: [
        { value: "", label: "Select State / Union Territory" },
        ...states.map((st) => ({ value: st, label: st })),
      ],
    },
    {
      label: "District",
      value: formData.district || "Not provided",
      icon: MapPin,
      name: "district",
      editable: true,
      isSelect: true,
      disabled: !formData.state,
      options: [
        {
          value: "",
          label: formData.state ? "Select District" : "Select state first",
        },
        ...districts.map((dst) => ({ value: dst, label: dst })),
      ],
    },
    {
      label: "Annual Family Income",
      value: formData.annual_family_income
        ? `₹ ${Number(formData.annual_family_income).toLocaleString("en-IN")}`
        : "Not provided",
      icon: IndianRupee,
      name: "annual_family_income",
      editable: true,
      type: "number",
    },
  ];

  return (
    <div className="dashboard" style={{ overflow: "hidden" }}>
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
            className="sidebar-link active"
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
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div>
              <h1 className="dashboard-title">My Profile</h1>
              <p className="dashboard-subtitle">Manage your personal citizen information</p>
            </div>
          </div>

          <div className="dashboard-user">
            <button
              type="button"
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

            <div className="dashboard-avatar">{name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* PROFILE CONTAINER */}
        <div className="profile-container">
          {loading && (
            <div style={{ padding: "50px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7e5" }}>
              <RefreshCw size={28} className="spin-animation" color="#367c4b" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "14px", fontWeight: "700" }}>Loading your citizen profile...</div>
            </div>
          )}

          {error && !loading && (
            <div className="auth-error" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{error}</span>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontWeight: "700",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#e8fff0",
                border: "1px solid #a5efbd",
                color: "#16803c",
                fontSize: "13px",
                fontWeight: "700",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              Profile updated successfully!
            </div>
          )}

          {notFound && !loading && (
            <div
              className="profile-card"
              style={{ textAlign: "center", padding: "40px 30px" }}
            >
              <AlertCircle size={44} color="#f59e0b" style={{ margin: "0 auto 14px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>
                No Citizen Profile Found
              </h2>
              <p style={{ fontSize: "14px", color: "#666", maxWidth: "450px", margin: "0 auto 24px", lineHeight: "1.6" }}>
                You have not completed your citizen profile setup yet. Complete it now so CivicEase can evaluate scheme eligibility and auto-fill applications.
              </p>
              <button
                onClick={() => navigate("/create-profile")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "9px",
                  background: "#111",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "750",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <PlusCircle size={16} />
                Set Up Citizen Profile
              </button>
            </div>
          )}

          {!loading && !notFound && (
            <section className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>

                <div style={{ flex: 1 }}>
                  <h2>{name}</h2>
                  <p>{formData.email || localStorage.getItem("user_email")}</p>

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      background: "#c7ffd8",
                      color: "#367c4b",
                      fontSize: "11px",
                      fontWeight: "800",
                    }}
                  >
                    <ShieldCheck
                      size={12}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "5px",
                      }}
                    />
                    CITIZEN ACCOUNT
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {isEditing && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleCancelEdit}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "11px 16px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  )}

                  <button
                    disabled={saving}
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 16px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#111",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={15} className="spin-animation" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Pencil size={16} />
                        Edit Profile
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* COMMON PROFILE DETAILS */}
              <div className="profile-details">
                {commonDetails.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.name}>
                      <div
                        className="profile-detail-label"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <Icon size={14} />
                        {item.label}
                      </div>

                      {isEditing && item.editable ? (
                        item.name === "dob" ? (
                          <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                            <input
                              id="dob"
                              type="text"
                              name="dob"
                              placeholder="DD/MM/YYYY"
                              value={formData.dob || ""}
                              onChange={handleDobChange}
                              maxLength={10}
                              style={{
                                width: "100%",
                                padding: "10px 42px 10px 12px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                outlineColor: "#a5efbd",
                                fontSize: "14px",
                                boxSizing: "border-box",
                              }}
                            />
                            <button
                              type="button"
                              id="profile-dob-calendar-btn"
                              onClick={openCalendarPicker}
                              aria-label="Open calendar picker"
                              title="Open calendar picker"
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6b7280",
                                transition: "color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#367c4b")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                            >
                              <CalendarDays size={18} />
                            </button>
                            <input
                              type="date"
                              ref={datePickerRef}
                              tabIndex={-1}
                              aria-hidden="true"
                              max={getTodayIso()}
                              value={formatToIsoDob(formData.dob) || ""}
                              onChange={handleCalendarDateSelect}
                              style={{
                                position: "absolute",
                                opacity: 0,
                                pointerEvents: "none",
                                width: 0,
                                height: 0,
                                border: 0,
                                padding: 0,
                                margin: 0,
                                overflow: "hidden",
                              }}
                            />
                          </div>
                        ) : item.isSelect ? (
                          <select
                            id={item.name}
                            name={item.name}
                            value={formData[item.name] || ""}
                            onChange={handleChange}
                            disabled={item.disabled}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1px solid #ddd",
                              borderColor: item.disabled ? "#e5e7e5" : "#ddd",
                              borderRadius: "8px",
                              outlineColor: "#a5efbd",
                              fontSize: "14px",
                              background: item.disabled ? "#f5f7f5" : "#fff",
                              color: item.disabled ? "#a0a0a0" : "#111",
                              cursor: item.disabled ? "not-allowed" : "pointer",
                              boxSizing: "border-box",
                            }}
                          >
                            {item.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={item.name}
                            type={item.type || "text"}
                            name={item.name}
                            value={formData[item.name] || ""}
                            onChange={handleChange}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                            placeholder={item.placeholder}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              outlineColor: "#a5efbd",
                              fontSize: "14px",
                            }}
                          />
                        )
                      ) : (
                        <div className="profile-detail-value">{item.value}</div>
                      )}
                    </div>
                  );
                })}

                {/* Occupation Type Field */}
                <div>
                  <div
                    className="profile-detail-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <Briefcase size={14} />
                    Occupation Type
                  </div>

                  {isEditing ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                      <button
                        type="button"
                        id="profile-occupation-student-btn"
                        onClick={() => handleOccupationChange("student")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: formData.occupation_type === "student" ? "2px solid #367c4b" : "1px solid #d1d5db",
                          background: formData.occupation_type === "student" ? "#f0fff4" : "#ffffff",
                          color: formData.occupation_type === "student" ? "#235a34" : "#4b5563",
                          fontWeight: "750",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <GraduationCap size={15} /> Student
                      </button>
                      <button
                        type="button"
                        id="profile-occupation-worker-btn"
                        onClick={() => handleOccupationChange("worker")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: formData.occupation_type === "worker" ? "2px solid #367c4b" : "1px solid #d1d5db",
                          background: formData.occupation_type === "worker" ? "#f0fff4" : "#ffffff",
                          color: formData.occupation_type === "worker" ? "#235a34" : "#4b5563",
                          fontWeight: "750",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Briefcase size={15} /> Worker
                      </button>
                    </div>
                  ) : (
                    <div className="profile-detail-value" style={{ textTransform: "capitalize", fontWeight: "700" }}>
                      {formData.occupation_type === "worker" ? "Worker" : "Student"}
                    </div>
                  )}
                </div>
              </div>

              {/* STUDENT CONDITIONAL SECTION */}
              {formData.occupation_type === "student" && (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed #e2e8f0" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "750",
                        color: "#1e293b",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <GraduationCap size={18} color="#367c4b" />
                      Student Information
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                      Details about your enrolled course, current institution, and education level.
                    </p>
                  </div>

                  <div className="profile-details">
                    {/* Education Level */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <GraduationCap size={14} />
                        Education Level
                      </div>
                      {isEditing ? (
                        <select
                          name="education_level"
                          value={formData.education_level}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                            background: "#fff",
                          }}
                        >
                          <option value="">Select education level</option>
                          <option value="Below 10th">Below 10th</option>
                          <option value="10th Pass">10th Pass</option>
                          <option value="12th Pass">12th Pass</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Postgraduate">Postgraduate</option>
                          <option value="Doctorate">Doctorate</option>
                        </select>
                      ) : (
                        <div className="profile-detail-value">{formData.education_level || "Not provided"}</div>
                      )}
                    </div>

                    {/* Institution Name */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Building2 size={14} />
                        Institution Name
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="institution_name"
                          placeholder="School / College / University name"
                          value={formData.institution_name}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                          }}
                        />
                      ) : (
                        <div className="profile-detail-value">{formData.institution_name || "Not provided"}</div>
                      )}
                    </div>

                    {/* Course or Degree */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <BookOpen size={14} />
                        Course or Degree
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="course_or_degree"
                          placeholder="e.g. B.Tech Computer Science, B.Com"
                          value={formData.course_or_degree}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                          }}
                        />
                      ) : (
                        <div className="profile-detail-value">{formData.course_or_degree || "Not provided"}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* WORKER CONDITIONAL SECTION */}
              {formData.occupation_type === "worker" && (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed #e2e8f0" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "750",
                        color: "#1e293b",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Briefcase size={18} color="#367c4b" />
                      Worker Information
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                      Details about your employment status, industry sector, and employer organization.
                    </p>
                  </div>

                  <div className="profile-details">
                    {/* Employment Type */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Briefcase size={14} />
                        Employment Type
                      </div>
                      {isEditing ? (
                        <select
                          name="employment_type"
                          value={formData.employment_type}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                            background: "#fff",
                          }}
                        >
                          <option value="">Select employment type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Salaried">Salaried</option>
                          <option value="Self-employed">Self-employed</option>
                          <option value="Contract">Contract</option>
                          <option value="Daily Wage">Daily Wage</option>
                          <option value="Apprentice / Intern">Apprentice / Intern</option>
                        </select>
                      ) : (
                        <div className="profile-detail-value">{formData.employment_type || "Not provided"}</div>
                      )}
                    </div>

                    {/* Industry or Sector */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Building2 size={14} />
                        Industry or Sector
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="industry_or_sector"
                          placeholder="e.g. Information Technology, Agriculture"
                          value={formData.industry_or_sector}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                          }}
                        />
                      ) : (
                        <div className="profile-detail-value">{formData.industry_or_sector || "Not provided"}</div>
                      )}
                    </div>

                    {/* Employer Name */}
                    <div>
                      <div className="profile-detail-label" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Building2 size={14} />
                        Employer Name
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="employer_name"
                          placeholder="e.g. Example Technologies, State Transport"
                          value={formData.employer_name}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            outlineColor: "#a5efbd",
                            fontSize: "14px",
                          }}
                        />
                      ) : (
                        <div className="profile-detail-value">{formData.employer_name || "Not provided"}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECURITY CARD */}
          <section
            className="profile-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              background: "#f0fff4",
              borderColor: "#c7ffd8",
              marginTop: "20px",
            }}
          >
            <ShieldCheck size={25} color="#367c4b" />
            <div>
              <h3 style={{ fontSize: "15px", marginBottom: "5px" }}>
                Your information is secure
              </h3>
              <p style={{ fontSize: "13px", color: "#53715b", margin: 0 }}>
                Your personal information is verified with end-to-end security and used only for scheme evaluation.
              </p>
            </div>
          </section>

          {/* BACK TO DASHBOARD */}
          <button
            onClick={() => navigate("/home")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              background: "transparent",
              color: "#367c4b",
              fontSize: "14px",
              fontWeight: "700",
              marginTop: "20px",
              marginBottom: "25px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default MyProfile;