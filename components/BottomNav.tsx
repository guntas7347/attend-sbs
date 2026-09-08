"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Settings } from "lucide-react";
import { getCurrentUserAction } from "@/lib/actions/auth";

export default function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      try {
        const user = await getCurrentUserAction();
        if (user) {
          setRole(user.role);
        }
      } catch {
        // Ignore
      }
    }
    checkRole();
  }, [pathname]);

  // Hide bottom nav on attendance marking page to maximize focus & screen area
  if (pathname.startsWith("/attendance/")) {
    return null;
  }

  // Hide on login page
  if (pathname === "/login") {
    return null;
  }

  // Managers have an ultra-minimal single-purpose UI (My Courses only), so hide bottom nav
  if (role === "MANAGER") {
    return null;
  }

  const navItems = [
    {
      label: "Courses",
      href: "/courses",
      icon: BookOpen,
      isActive: pathname.startsWith("/courses") || pathname === "/",
    },
    {
      label: "Groups",
      href: "/groups",
      icon: Users,
      isActive: pathname.startsWith("/groups"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive:
        pathname.startsWith("/settings") || pathname.startsWith("/admin"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors ${
                active
                  ? "text-accent font-semibold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-accent/10" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-accent stroke-[2.5]" : ""}`}
                />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
