"use client";

import { Search, Bell, History, MessageSquare } from "lucide-react";
import { useOrg } from "@/components/OrgContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface Tab {
  label: string;
  key:   string;
}

interface TopbarProps {
  tabs?:       Tab[];
  activeTab?:  string;
  onTabChange?: (key: string) => void;
  showActions?: boolean;
}

export default function Topbar({
  tabs = [],
  activeTab,
  onTabChange,
  showActions = true,
}: TopbarProps) {
  const org = useOrg();

  return (
    <header
      className="flex items-center gap-6 h-16 px-8 border-b flex-shrink-0"
      style={{ borderColor: "var(--border-primary)" }}
    >
      {/* ── Tabs ── */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={cn(
                "nx-tab",
                activeTab === tab.key && "nx-tab-active"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* ── Search ── */}
      <div className="nx-input flex items-center gap-2 px-4 py-2 w-64">
        <Search
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          type="text"
          placeholder="Search tasks..."
          className="bg-transparent outline-none text-sm w-full"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* ── Actions ── */}
      {showActions && (
        <div className="flex items-center gap-1">
          <button className="nx-btn nx-btn-ghost p-2 rounded-lg">
            <Bell className="w-4 h-4" />
          </button>
          <button className="nx-btn nx-btn-ghost p-2 rounded-lg">
            <History className="w-4 h-4" />
          </button>
          <button className="nx-btn nx-btn-ghost p-2 rounded-lg">
            <MessageSquare className="w-4 h-4" />
          </button>
          <ThemeToggle />

          {/* Real avatar */}
          {org.userImage ? (
            <img
              src={org.userImage}
              alt={org.userName}
              className="w-9 h-9 rounded-full ml-2 flex-shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center ml-2 flex-shrink-0 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
              }}
            >
              {(org.userName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </header>
  );
}