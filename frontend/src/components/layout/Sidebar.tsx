"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  Search,
  FlaskConical,
  BarChart3,
  MessageSquare,
  Database,
  Code2,
  FileSpreadsheet,
  FileText,
  Settings,
  LogOut,
  Bot,
} from "lucide-react";

const NAV = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    requiresData: true,
  },
  {
    href: "/upload",
    icon: Upload,
    label: "Upload Dataset",
    requiresData: false,
  },
  {
    href: "/explorer",
    icon: Search,
    label: "Dataset Explorer",
    requiresData: true,
  },
  {
    href: "/analysis",
    icon: FlaskConical,
    label: "AI Analysis",
    requiresData: true,
  },
  {
    href: "/charts",
    icon: BarChart3,
    label: "Charts & Insights",
    requiresData: true,
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Chat with Data",
    requiresData: true,
  },
  { href: "/sql", icon: Database, label: "SQL Queries", requiresData: true },
  { href: "/python", icon: Code2, label: "Python Scripts", requiresData: true },
  {
    href: "/excel",
    icon: FileSpreadsheet,
    label: "Excel Formulas",
    requiresData: true,
  },
  { href: "/reports", icon: FileText, label: "Reports", requiresData: true },
  { href: "/settings", icon: Settings, label: "Settings", requiresData: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeDataset, logout, theme } = useAppStore();
  const isDark = theme === "dark";
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <aside
      className={`flex flex-col w-56 h-screen shrink-0 border-r
      ${isDark ? "bg-dark-500 border-dark-300" : "bg-white border-gray-200"}`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b
        ${isDark ? "border-dark-300" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-purple-500">
          <Bot size={16} className="text-dark-600" />
        </div>
        <div>
          <p
            className={`text-sm font-bold leading-tight ${isDark ? "text-dark-50" : "text-gray-900"}`}
          >
            AI Analyst
          </p>
          <p
            className={`text-[9px] tracking-widest uppercase ${isDark ? "text-dark-200" : "text-gray-400"}`}
          >
            Data Intelligence
          </p>
        </div>
      </div>

      {/* Active dataset pill */}
      {activeDataset && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-brand/10 border border-brand/30">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-brand text-[11px] font-bold truncate">
              {activeDataset.name}
            </span>
          </div>
          <p
            className={`text-[9px] mt-0.5 ${isDark ? "text-dark-200" : "text-gray-400"}`}
          >
            {activeDataset.rowCount?.toLocaleString()} rows ·{" "}
            {activeDataset.columnCount} cols
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, icon: Icon, label, requiresData }) => {
          const active = pathname === href;
          const disabled = requiresData && !activeDataset;
          return (
            <Link
              key={href}
              href={disabled ? "/upload" : href}
              className={[
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "bg-brand/15 border border-brand/40 text-brand"
                  : disabled
                    ? `opacity-50 cursor-not-allowed ${isDark ? "text-dark-300" : "text-gray-300"}`
                    : isDark
                      ? "text-dark-200 hover:text-dark-50 hover:bg-dark-400"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
              ].join(" ")}
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        className={`px-3 py-3 border-t relative ${isDark ? "border-dark-300" : "border-gray-200"}`}
      >
        {profileOpen && (
          <div
            className={`absolute bottom-16 left-2 right-2 rounded-xl border shadow-xl z-30 overflow-hidden
            ${isDark ? "bg-dark-400 border-dark-300" : "bg-white border-gray-200"}`}
          >
            <div
              className={`p-4 border-b ${isDark ? "border-dark-300" : "border-gray-100"}`}
            >
              <p
                className={`text-sm font-bold ${isDark ? "text-dark-50" : "text-gray-900"}`}
              >
                {user?.name ?? "User"}
              </p>
              <p
                className={`text-xs mt-0.5 ${isDark ? "text-dark-200" : "text-gray-400"}`}
              >
                {user?.email ?? ""}
              </p>
            </div>
            <div className="p-2 space-y-1">
              {[
                { label: "Plan", value: `${user?.plan ?? "Pro"} Plan` },
                { label: "Account", value: "Active" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex justify-between px-3 py-2 rounded-lg text-xs
                  ${isDark ? "bg-dark-500 text-dark-200" : "bg-gray-50 text-gray-500"}`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`font-semibold ${isDark ? "text-dark-50" : "text-gray-900"}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div
              className={`p-2 border-t ${isDark ? "border-dark-300" : "border-gray-100"}`}
            >
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className={`w-full flex items-center gap-2.5 rounded-lg p-1.5 transition-colors
            ${isDark ? "hover:bg-dark-400" : "hover:bg-gray-100"}`}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-brand text-dark-600 text-[11px] font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? "text-dark-50" : "text-gray-900"}`}
            >
              {user?.name ?? "User"}
            </p>
            <p
              className={`text-[9px] capitalize ${isDark ? "text-dark-200" : "text-gray-400"}`}
            >
              {user?.plan ?? "Pro"} Plan
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
