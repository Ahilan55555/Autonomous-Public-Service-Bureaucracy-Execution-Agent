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
  CheckCircle2,
  XCircle,
  UserRound,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { authApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import { validatePassword, validateEmail } from "../utils/password";
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

  // Real-time evaluation of each password requirement
  const { isValid: isPasswordValid, results: passwordRuleResults } = validatePassword(formData.password);
  const hasTypedPassword = formData.password.length > 0;

  const hasTypedConfirm = formData.confirmPassword.length > 0;
  const isConfirmMatch = formData.confirmPassword === formData.password;
  const isConfirmValid = hasTypedConfirm && isConfirmMatch;

  const isEmailValid = validateEmail(formData.email);

  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password, confirmPassword } = formData;
    const cleanEmail = email.trim();

    if (!cleanEmail || !isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must satisfy all 5 strength requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Register with backend
      await authApi.register(cleanEmail, password);

      // 2. Log in automatically to acquire JWT Bearer token for profile creation
      try {
        const loginRes = await authApi.login(cleanEmail, password);
        if (loginRes?.access_token) {
          localStorage.setItem("access_token", loginRes.access_token);
          localStorage.setItem("user_id", String(loginRes.user_id));
          localStorage.setItem("isLoggedIn", "true");
        }
      } catch {
        // If auto-login fails, user can still log in manually
      }

      localStorage.setItem("user_email", cleanEmail);

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
              Simple &amp; Secure
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
              <label htmlFor="signup-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={17} />
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password">Password</label>
              <div className="input-wrapper">
                <Lock size={17} />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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

              {/* Real-time Password Requirements Checklist */}
              <div className="password-requirements-card">
                <div className="password-requirements-title">Password Requirements:</div>
                {passwordRuleResults.map((rule) => {
                  let statusClass = "unmet";
                  let icon = <span style={{ fontSize: "11px", color: "#888" }}>○</span>;

                  if (hasTypedPassword) {
                    if (rule.passed) {
                      statusClass = "valid";
                      icon = <CheckCircle2 size={14} color="#16803c" />;
                    } else {
                      statusClass = "invalid";
                      icon = <XCircle size={14} color="#dc2626" />;
                    }
                  }

                  return (
                    <div key={rule.id} className={`password-rule-item ${statusClass}`}>
                      <div className="password-rule-icon">{icon}</div>
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={17} />
                <input
                  id="signup-confirm-password"
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

              {/* Confirm Password Inline Match Status */}
              {hasTypedConfirm && (
                <div className={`confirm-password-status ${isConfirmMatch ? "match" : "mismatch"}`}>
                  {isConfirmMatch ? (
                    <>
                      <CheckCircle2 size={13} color="#16803c" /> Passwords match
                    </>
                  ) : (
                    <>
                      <XCircle size={13} color="#dc2626" /> Passwords do not match
                    </>
                  )}
                </div>
              )}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-button"
              disabled={!isFormValid || isSubmitting}
              title={
                !isFormValid
                  ? "Please fulfill all password requirements and ensure passwords match"
                  : "Create Account"
              }
            >
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
