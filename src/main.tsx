import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Lazy porque @supabase/supabase-js + o painel de upload só interessam a
// quem loga em /admin — visitante comum do site não deveria baixar esse peso.
const AdminPage = lazy(() => import("./app/pages/AdminPage.tsx"));

const isAdmin = window.location.pathname.startsWith("/admin");

createRoot(document.getElementById("root")!).render(
  isAdmin ? (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AdminPage />
    </Suspense>
  ) : (
    <App />
  ),
);
