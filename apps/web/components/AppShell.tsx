"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navItems = [
  { id: "feed", label: "Feed", icon: "*", href: "/feed", badge: "3" },
  { id: "submit", label: "Submit", icon: "+", href: "/submit" },
  { id: "profile", label: "My Profile", icon: "o", href: "/profile/0xme" },
  { id: "dao", label: "DAO", icon: "#", href: "/dao" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">
          <div className="logo-icon" />
          DevDAO
        </div>
        <div className="ticker">
          <div className="ticker-item">DEV/USDC <span className="up">$0.042 +2.3%</span></div>
          <div className="ticker-item">Proposals <span className="up">3 active</span></div>
          <div className="ticker-item">Next finalise <span>in 2h 14m</span></div>
        </div>
        <div className="topbar-right">
          <div className="wallet-btn">
            <div className="wallet-dot" />
            0x1f9a...d4E2
          </div>
        </div>
      </header>

      <nav className="sidebar">
        <div className="nav-section">Navigation</div>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.id} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
        <div className="nav-section" style={{ marginTop: 12 }}>Resources</div>
        {["Docs", "Smart Contracts", "Discord"].map((label) => (
          <div key={label} className="nav-item">
            <span className="nav-icon">-</span>
            <span>{label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "14px 10px", background: "rgba(0,229,255,.04)", borderRadius: 8, border: "1px solid rgba(0,229,255,.1)", marginTop: 8 }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--cyan)", fontWeight: 700, marginBottom: 6 }}>VOTING POWER</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>12,450</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>DEV tokens ? BUILDER tier</div>
        </div>
      </nav>

      <main className="main">
        <div className="hex-bg" />
        {children}
      </main>
    </div>
  );
}
