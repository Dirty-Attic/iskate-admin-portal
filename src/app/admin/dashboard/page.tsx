'use client';

import { useUser } from "@/context/UserContext";
import DashboardNavBar from "@/components/DashboardNavBar";
import DashboardSideNav from "@/components/DashboardSideNav";

export default function AdminDashboardPage() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardNavBar user={user} />
      <div className="flex flex-1">
        <DashboardSideNav />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
        </main>
      </div>
    </div>
  );
}