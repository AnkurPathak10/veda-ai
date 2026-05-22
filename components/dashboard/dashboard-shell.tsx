"use client";

import { useEffect, useState } from "react";
import { DashboardNavbar } from "./dashboard-navbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileFab } from "./mobile-fab";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#ebebeb] p-2 sm:p-3 lg:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1600px] gap-3 lg:min-h-[calc(100vh-2rem)] lg:gap-4">
        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block">
          <div className="sticky top-4 h-[calc(100vh-2rem)]">
            <Sidebar />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
              aria-label="Close menu overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-2 top-2 bottom-2">
              <Sidebar
                showClose
                onClose={() => setMobileMenuOpen(false)}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 pb-24 lg:gap-4 lg:pb-0">
          <DashboardNavbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#f5f5f5] shadow-sm">
            {children}
          </main>
        </div>
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  );
}
