import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardSideNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard/app", label: "App Management", icon: "" },
    { href: "/admin/dashboard/user", label: "User Management", icon: "" },
    { href: "/admin/dashboard/reports", label: "Reports", icon: "" },
  ];

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Mobile toggle button - bottom left, only visible on mobile */}
      <button
        className="md:hidden fixed bottom-6 left-4 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Sidebar - positioned below navbar on mobile */}
      <aside
        className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed md:static z-30 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          top: '73px', // Height of navbar + border
          height: 'calc(100vh - 73px)',
          left: 0
        }}
      >
        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-full" role="navigation" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return isActive ? (
              <div
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800"
                aria-current="page"
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                {item.label}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={closeSidebar}
              >
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed bg-black/50 z-20 md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
          style={{
            top: '73px',
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}
    </>
  );
}