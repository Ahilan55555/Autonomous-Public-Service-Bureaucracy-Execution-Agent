import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { authApi } from "../api/services";
import BackendStatusModal from "../components/BackendStatusModal";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await authApi.login(formData.email.trim(), formData.password);

      if (!res?.access_token) {
        throw new Error("Login failed: no access token returned by server.");
      }

      // Store auth session
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_id", String(res.user_id));
      localStorage.setItem("user_email", formData.email.trim());
      localStorage.setItem("isLoggedIn", "true");

      navigate("/home");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {/* LEFT PANEL */}
      <section className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <ShieldCheck size={24} />
          </div>
          CivicEase
        </div>

        <div className="auth-left-content">
          <h1>
            Your gateway to
            <br />
            <span>public services.</span>
          </h1>

          <p>
            Everything you need to access government services,
            all in one place. Simple, transparent, and designed
            around you.
          </p>

          <div className="auth-illustration">
            <div className="auth-circle">
              <ShieldCheck size={80} color="#367c4b" />
            </div>

            <div className="auth-floating-card auth-floating-top">
              <ShieldCheck size={18} color="#367c4b" />
              Trusted Platform
            </div>

            <div className="auth-floating-card auth-floating-bottom">
              <Lock size={18} color="#367c4b" />
              Secure Access
            </div>
          </div>

          <div className="auth-features">
            <div>
              <ShieldCheck size={18} />
              Secure citizen authentication
            </div>
            <div>
              <ShieldCheck size={18} />
              Simplified government procedures
            </div>
            <div>
              <ShieldCheck size={18} />
              Personalized service assistance
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          © 2026 CivicEase. Empowering citizens.
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="auth-right">
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

          <div className="auth-mobile-brand">
            <ShieldCheck size={30} />
            CivicEase
          </div>

          <div className="auth-welcome">
            <span className="auth-small-label">WELCOME BACK</span>
            <h2>Sign in to CivicEase</h2>
            <p>
              Enter your credentials to access your citizen dashboard.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Email Address</label>

              <div className="auth-input-wrapper">
                <Mail size={18} />
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

            <div className="auth-form-group">
              <label>Password</label>

              <div className="auth-input-wrapper">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    color: "#777",
                    cursor: "pointer",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Create account</Link>
          </div>

          <div className="auth-security">
            <ShieldCheck size={15} />
            Your information is kept secure
          </div>
        </div>
      </section>

      <BackendStatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} />
    </div>
  );
}

export default Login;
