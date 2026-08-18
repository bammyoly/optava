//frontend/components/layout/AppShell.tsx

"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";

interface Tab {
  label: string;
  key:   string;
}

interface AppShellProps {
  children:      React.ReactNode;
  tabs?:         Tab[];
  defaultTab?:   string;
  onTabChange?:  (key: string) => void;
}

export default function AppShell({
  children,
  tabs = [],
  defaultTab,
  onTabChange,
}: AppShellProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    onTabChange?.(key);
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}