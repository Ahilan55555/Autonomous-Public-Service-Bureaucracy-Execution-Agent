import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  UserRound,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { authApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import "../App.css";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should have at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Register with backend
      await authApi.register(email.trim(), password);

      // 2. Log in automatically to acquire JWT Bearer token for profile creation
      try {
        const loginRes = await authApi.login(email.trim(), password);
        if (loginRes?.access_token) {
          localStorage.setItem("access_token", loginRes.access_token);
          localStorage.setItem("user_id", String(loginRes.user_id));
          localStorage.setItem("isLoggedIn", "true");
        }
      } catch {
        // If auto-login fails, user can still log in manually
      }

      localStorage.setItem("user_email", email.trim());

      // Navigate to create-profile setup
      navigate("/create-profile");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <span>CivicEase</span>
        </div>

        <div className="auth-left-content">
          <h1>
            Government services,
            <br />
            <span>made simple.</span>
          </h1>

          <p>
            Your personal assistant for navigating public services.
            Spend less time on paperwork and more time on what matters.
          </p>

          <div className="auth-illustration">
            <div className="illustration-circle">
              <ShieldCheck size={60} />
            </div>

            <div className="illustration-badge badge-top">
              <CheckCircle size={15} />
              Simple & Secure
            </div>

            <div className="illustration-badge badge-bottom">
              <UserRound size={14} />
              Citizen First
            </div>
          </div>

          <div className="auth-features">
            <div>
              <CheckCircle size={16} />
              One profile for multiple services
            </div>
            <div>
              <CheckCircle size={16} />
              Guided application flow
            </div>
            <div>
              <CheckCircle size={16} />
              Easy access to government schemes
            </div>
          </div>
        </div>

        <div className="auth-footer">
          © 2026 CivicEase. Empowering citizens.
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #e5e7e5",
                background: "#f9faf9",
                color: "#555",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <Wifi size={13} color="#367c4b" />
              Backend Network Status
            </button>
          </div>

          <div className="auth-heading">
            <span className="auth-tag">GET STARTED</span>
            <h2>Create your account</h2>
            <p>
              Join CivicEase and make accessing public services easier.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={17} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={17} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

          <div className="auth-security">
            <ShieldCheck size={16} />
            Your information is kept secure
          </div>
        </div>
      </div>

      <BackendStatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} />
    </div>
  );
}

export default Signup;
