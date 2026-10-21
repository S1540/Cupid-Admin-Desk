"use client";
import { ui } from "@/lib/ui";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("cupid-theme", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("cupid-theme", callback); };
}
function snapshot() {
  try { return localStorage.getItem("cupid-theme") === "light" ? "light" : "dark"; }
  catch { return document.documentElement.dataset.theme || "dark"; }
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => "dark");
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("cupid-theme", next); } catch { /* Session-only preference if storage is blocked. */ }
    window.dispatchEvent(new Event("cupid-theme"));
  }
  return <button className={ui("icon-button theme-toggle")} onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>;
}
