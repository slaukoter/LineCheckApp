import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ItemsPage from "./pages/ItemsPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api("/api/check_session")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    await api("/api/logout", { method: "DELETE" });
    setUser(null);
  }

  if (!authChecked) return <div>Loading...</div>;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <LoginPage onAuthed={setUser} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <SignupPage onAuthed={setUser} />}
      />

      <Route
        path="/"
        element={
          user ? (
            <DashboardPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/inventories/:inventoryId"
        element={user ? <ItemsPage /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
