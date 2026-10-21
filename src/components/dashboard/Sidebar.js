"use client";
import { ui } from "@/lib/ui";

import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  ShoppingBag,
  UsersRound,
  X,
  SlidersVertical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Customers", href: "/customers", icon: UsersRound },
  { label: "App Controls", href: "/app-controls", icon: SlidersVertical },
];
export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const panel = useRef(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current.querySelector("button")?.focus();
    const key = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key === "Tab") {
        const nodes = [...panel.current.querySelectorAll("a, button")].filter(
          (el) => el.getClientRects().length,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mobileOpen, setMobileOpen]);
  return (
    <>
      {mobileOpen && (
        <div
          className={ui("drawer-backdrop")}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={panel}
        className={ui(
          `sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`,
        )}
        aria-label="Main navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
      >
        <div className={ui("brand")}>
          <Image
            src="https://res.cloudinary.com/drsoj4c5q/image/upload/v1792414552/Cupid512_1_lw3rqp.png"
            alt="Cupid Admin Desk"
            width={40}
            height={40}
            unoptimized
            className="size-10 shrink-0 object-contain"
          />
          <button
            className={ui("icon-button mobile-close")}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className={ui("nav-group sidebar-label")}>WORKSPACE</div>
        <nav>
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={ui(
                `nav-item ${pathname === href ? "is-active" : "is-inactive"}`,
              )}
              aria-current={pathname === href ? "page" : undefined}
              title={label}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span className={ui("sidebar-label")}>{label}</span>
              {pathname === href && (
                <span className={ui("nav-dot sidebar-label")} />
              )}
            </Link>
          ))}
        </nav>
        <div className={ui("sidebar-bottom")}>
          <div className={ui("workspace-profile")}>
            <span className={ui("avatar")}>CC</span>
            <div className={ui("sidebar-label")}>
              <strong>Cupid Clothings</strong>
              <small>Admin workspace</small>
            </div>
            <ArrowUpRight size={14} className={ui("sidebar-label")} />
          </div>
        </div>
      </aside>
    </>
  );
}
