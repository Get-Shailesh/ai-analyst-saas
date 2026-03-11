"use client";

import { useAppStore } from "@/store/useAppStore";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PAGES = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: "/upload" },
  { label: "Explorer", href: "/explorer" },
  { label: "Analysis", href: "/analysis" },
  { label: "Charts", href: "/charts" },
  { label: "SQL", href: "/sql" },
  { label: "Python", href: "/python" },
  { label: "Excel", href: "/excel" },
  { label: "Reports", href: "/reports" },
  { label: "Chat", href: "/chat" },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "Dataset uploaded successfully",
    time: "Just now",
    unread: true,
  },
  { id: 2, text: "Analysis complete", time: "2 min ago", unread: true },
  { id: 3, text: "Report generated", time: "10 min ago", unread: false },
];

export function TopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { theme, setTheme } = useAppStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const filtered = PAGES.filter((p) =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifs((n) => n.map((x) => ({ ...x, unread: false })));

  const isDark = theme === "dark";

  return (
    <header
      className={`flex items-center justify-between px-7 py-4 border-b sticky top-0 z-20 backdrop-blur
      ${isDark ? "border-dark-300 bg-dark-600/80" : "border-gray-200 bg-white/90"}`}
    >
      <div>
        <h1
          className={`text-lg font-bold ${isDark ? "text-dark-50" : "text-gray-900"}`}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={`text-xs mt-0.5 ${isDark ? "text-dark-200" : "text-gray-500"}`}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => {
              setSearchOpen((o) => !o);
              setNotifOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors
              ${isDark ? "bg-dark-500 border-dark-300 text-dark-200 hover:text-dark-50" : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900"}`}
          >
            <Search size={12} /> Search...
          </button>
          {searchOpen && (
            <div
              className={`absolute right-0 top-10 w-64 rounded-xl border shadow-xl z-30 overflow-hidden
              ${isDark ? "bg-dark-500 border-dark-300" : "bg-white border-gray-200"}`}
            >
              <div className="p-2 border-b border-inherit">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className={`w-full px-3 py-2 rounded-lg text-xs outline-none
                    ${isDark ? "bg-dark-400 text-dark-50 placeholder:text-dark-200" : "bg-gray-100 text-gray-900 placeholder:text-gray-400"}`}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.href}
                    onClick={() => {
                      router.push(p.href);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors
                      ${isDark ? "text-dark-200 hover:bg-dark-400 hover:text-dark-50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                  >
                    {p.label}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p
                    className={`px-4 py-3 text-xs ${isDark ? "text-dark-200" : "text-gray-400"}`}
                  >
                    No pages found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`p-2 rounded-lg border transition-colors
            ${isDark ? "bg-dark-500 border-dark-300 text-dark-200 hover:text-dark-50" : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900"}`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setSearchOpen(false);
            }}
            className={`relative p-2 rounded-lg border transition-colors
              ${isDark ? "bg-dark-500 border-dark-300 text-dark-200 hover:text-dark-50" : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900"}`}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </button>
          {notifOpen && (
            <div
              className={`absolute right-0 top-10 w-72 rounded-xl border shadow-xl z-30 overflow-hidden
              ${isDark ? "bg-dark-500 border-dark-300" : "bg-white border-gray-200"}`}
            >
              <div
                className={`flex justify-between items-center px-4 py-3 border-b
                ${isDark ? "border-dark-300" : "border-gray-100"}`}
              >
                <p
                  className={`text-xs font-bold ${isDark ? "text-dark-50" : "text-gray-900"}`}
                >
                  Notifications{" "}
                  {unreadCount > 0 && (
                    <span className="text-brand">({unreadCount})</span>
                  )}
                </p>
                <button
                  onClick={markAllRead}
                  className="text-brand text-[10px] hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div>
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b flex items-start gap-3 transition-colors
                    ${isDark ? "border-dark-300/50 hover:bg-dark-400" : "border-gray-50 hover:bg-gray-50"}`}
                  >
                    {n.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                    )}
                    {!n.unread && <span className="w-1.5 h-1.5 shrink-0" />}
                    <div>
                      <p
                        className={`text-xs ${isDark ? "text-dark-50" : "text-gray-800"} ${n.unread ? "font-semibold" : ""}`}
                      >
                        {n.text}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 ${isDark ? "text-dark-200" : "text-gray-400"}`}
                      >
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(searchOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setSearchOpen(false);
            setNotifOpen(false);
          }}
        />
      )}
    </header>
  );
}
