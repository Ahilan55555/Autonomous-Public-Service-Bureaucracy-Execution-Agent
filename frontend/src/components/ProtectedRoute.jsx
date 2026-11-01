import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");

  useEffect(() => {
    function handleAuthExpired() {
      setToken(null);
      setIsLoggedIn(false);
    }

    window.addEventListener("civic_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("civic_auth_expired", handleAuthExpired);
    };
  }, []);

  const isAuth = Boolean(token) && isLoggedIn;

  return isAuth ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;