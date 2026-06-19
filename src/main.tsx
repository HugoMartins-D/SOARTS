import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import LoginPage from "./app/pages/LoginPage.tsx";
import AdminPage from "./app/pages/AdminPage.tsx";
import ProtectedRoute from "./app/components/ProtectedRoute.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);
