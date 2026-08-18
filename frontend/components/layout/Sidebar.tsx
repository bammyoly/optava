//frontend/components/layout/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/components/OrgContext";
import {
  LayoutGrid,
  MessageSquare,
  CheckSquare,
  Lightbulb,
  Zap,
  Users,
  Sparkles,
  Settings,
  HelpCircle,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label:  string;
  href:   string;
  icon:   React.ElementType;
  badge?: number;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/app",           icon: LayoutGrid  },
  { label: "Chat",      href: "/app/chat",      icon: MessageSquare },
  { label: "Tasks",     href: "/app/tasks",     icon: CheckSquare },
  { label: "Decisions", href: "/app/decisions", icon: Lightbulb   },
  { label: "Briefings", href: "/app/standup",   icon: Zap         },
  { label: "Team",      href: "/app/team",      icon: Users       },
];

const bottomNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const org      = useOrg();

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  return (
    <aside className="nx-sidebar flex flex-col h-screen w-[240px] flex-shrink-0">

      {/* ── Logo card ── */}
<div className="p-4">
  <div
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{
      background: "var(--bg-card)",
      border:     "1px solid var(--border-primary)",
    }}
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      }}
    >
      <Brain className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0">
      <h1
        className="font-bold text-[15px] leading-tight truncate"
        style={{ color: "var(--text-primary)" }}
      >
        <Link href='/'>
           Optava AI
        </Link>
      </h1>
      <p
        className="text-[11px] leading-tight mt-0.5 truncate"
        style={{ color: "var(--text-tertiary)" }}
      >
        {org.orgName || "workspace"}
      </p>
    </div>
  </div>
</div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nx-nav-item",
                active && "nx-nav-item-active"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>

              {item.badge && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: active
                      ? "var(--accent-purple-bg)"
                      : "var(--bg-subtle)",
                    color: active
                      ? "var(--accent-purple)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Ask AI button ── */}
      <div className="px-3 pb-3">
        <Link href="/app/chat" className="nx-ask-ai">
          <Sparkles className="w-4 h-4" />
          <span>Ask AI</span>
        </Link>
      </div>

      {/* ── Bottom nav ── */}
      <div className="px-3 pb-4 flex flex-col gap-1">
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nx-nav-item",
                active && "nx-nav-item-active"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button className="nx-nav-item text-left">
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>Help</span>
        </button>
      </div>

      {/* ── User info ── */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            }}
          >
            {(org.userName || org.orgName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {org.userName || org.orgName || "Guest"}
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {org.orgRole || "owner"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}