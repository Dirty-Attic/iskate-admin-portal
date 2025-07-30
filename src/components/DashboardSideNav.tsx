import Link from "next/link";
import { useState } from "react";

export default function DashboardSideNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white rounded-full p-2 shadow"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation"
      >
        ☰
      </button>
      <aside
        className={`w-64 border-r min-h-screen py-8 px-4 bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] fixed md:static top-0 left-0 z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
        }}
      >
        <nav className="flex flex-col gap-4">
          <Link
            href="/admin/dashboard/app"
            className="font-medium hover:text-blue-600"
            style={{ color: 'var(--foreground)' }}
          >
            App Management
          </Link>
          <Link
            href="/admin/dashboard/user"
            className="font-medium hover:text-blue-600"
            style={{ color: 'var(--foreground)' }}
          >
            User Management
          </Link>
          <Link
            href="/admin/dashboard/reports"
            className="font-medium hover:text-blue-600"
            style={{ color: 'var(--foreground)' }}
          >
            Reports
          </Link>
        </nav>
        {/* Close button for mobile */}
        <button
          className="md:hidden mt-8 text-sm text-blue-600"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </aside>
      {/* Overlay for mobile nav */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}