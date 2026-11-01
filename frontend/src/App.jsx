import { Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import Home from "./pages/Home";
import MyProfile from "./pages/MyProfile";
import SearchDiscovery from "./pages/SearchDiscovery";
import SchemesCatalog from "./pages/SchemesCatalog";
import DocumentVaultPage from "./pages/DocumentVaultPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-profile" element={<CreateProfile />} />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schemes-catalog"
        element={
          <ProtectedRoute>
            <SchemesCatalog />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schemes"
        element={
          <ProtectedRoute>
            <SchemesCatalog />
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <SchemesCatalog />
          </ProtectedRoute>
        }
      />

      <Route
        path="/search-discovery"
        element={
          <ProtectedRoute>
            <SearchDiscovery />
          </ProtectedRoute>
        }
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchDiscovery />
          </ProtectedRoute>
        }
      />

      <Route
        path="/document-vault"
        element={
          <ProtectedRoute>
            <DocumentVaultPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <DocumentVaultPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications"
        element={
          <ProtectedRoute>
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-profile"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;