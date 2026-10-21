"use client";
import { useEffect } from "react";
import { startAdminSync } from "@/lib/admin-sync";
export default function AdminDataProvider({ children }) {
  useEffect(() => startAdminSync(), []);
  return children;
}
