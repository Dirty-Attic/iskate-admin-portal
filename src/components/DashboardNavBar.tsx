import { useState } from "react";
import Image from "next/image";
import { User } from "@/context/UserContext";

type DashboardNavBarProps = {
  user: User;
};

export default function DashboardNavBar({ user }: DashboardNavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="flex items-center justify-between px-8 py-4 border-b shadow-sm"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        borderColor: 'var(--border)',
      }}
    >
      <span className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
        iSkate Admin Portal
      </span>
      <div className="relative">
        <button
          className="flex items-center gap-2 focus:outline-none"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div
            className="w-10 h-10 rounded-full border overflow-hidden bg-gray-100 dark:bg-zinc-800"
          >
            <Image
              src={user?.photoURL && user.photoURL.trim() !== "" ? user.photoURL : "/window.svg"}
              alt={user?.username ?? ""}
              width={40}
              height={40}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/window.svg";
              }}
              className="object-cover w-10 h-10"
            />
          </div>
        </button>
        {menuOpen && user && (
          <div
            className="absolute right-0 mt-2 w-40 border rounded shadow-lg z-10"
            style={{
              background: 'var(--background)',
              color: 'var(--foreground)',
              borderColor: 'var(--border)',
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
            }}
          >
            <div className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{user.username}</div>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
              style={{ color: '#e11d48', background: 'var(--card)' }}
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}