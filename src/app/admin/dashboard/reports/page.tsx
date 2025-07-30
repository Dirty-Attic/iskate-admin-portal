"use client";

import { useEffect, useState } from "react";
import { app } from "@/utils/firebase";
import { useUser } from "@/context/UserContext";
import DashboardNavBar from "@/components/DashboardNavBar";
import DashboardSideNav from "@/components/DashboardSideNav";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

type Report = {
  reportId: string;
  additionalDetails: string;
  appVersion: string;
  createdAt: string;
  platform: string;
  reportCategory: string;
  reportedUser: {
    email: string;
    fullName: string;
    uid: string;
    username: string;
  };
  reportingUser: {
    email: string;
    fullName: string;
    uid: string;
    username: string;
  };
  status: string;
  timestamp: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const { user } = useUser();
  const db = getFirestore(app);

  useEffect(() => {
    async function fetchReports() {
      try {
        const reportsCol = collection(db, "reports");
        const snapshot = await getDocs(reportsCol);
        const data: Report[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            reportId: docSnap.id,
            additionalDetails: d.additionalDetails ?? "",
            appVersion: d.appVersion ?? "",
            createdAt: d.createdAt ?? d.timestamp ?? "",
            platform: d.platform ?? "",
            reportCategory: d.reportCategory ?? "",
            reportedUser: {
              email: d.reportedUser?.email ?? "",
              fullName: d.reportedUser?.fullName ?? "",
              uid: d.reportedUser?.uid ?? "",
              username: d.reportedUser?.username ?? "",
            },
            reportingUser: {
              email: d.reportingUser?.email ?? "",
              fullName: d.reportingUser?.fullName ?? "",
              uid: d.reportingUser?.uid ?? "",
              username: d.reportingUser?.username ?? "",
            },
            status: d.status ?? "",
            timestamp: d.timestamp ?? "",
          };
        });
        setReports(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to fetch reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [db]);

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMarkResolved = async (reportId: string) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, { status: "Resolved" });
      setReports((prev) =>
        prev.map((r) =>
          r.reportId === reportId ? { ...r, status: "Resolved" } : r
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Update failed:", err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8">Loading reports...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const pendingReports = reports.filter((r) => r.status !== "Resolved");
  const resolvedReports = reports.filter((r) => r.status === "Resolved");

  const renderReportCard = (report: Report, showResolve: boolean) => {
    const isOpen = openCards[report.reportId];
    return (
      <div
        key={report.reportId}
        className="border rounded shadow"
        style={{
          background: "var(--card)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
      >
        <button
          className="w-full flex items-center justify-between px-4 py-3 rounded-t cursor-pointer focus:outline-none"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
          }}
          onClick={() => toggleCard(report.reportId)}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-4 flex-1">
            <span
              className="font-semibold text-lg"
              style={{ color: "var(--foreground)" }}
            >
              {report.reportCategory}
            </span>
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                background:
                  report.status === "Open"
                    ? "rgba(34,197,94,0.12)"
                    : report.status === "Resolved"
                    ? "rgba(156,163,175,0.18)"
                    : "rgba(156,163,175,0.12)",
                color:
                  report.status === "Open"
                    ? "#22c55e"
                    : report.status === "Resolved"
                    ? "#6b7280"
                    : "#6b7280",
              }}
            >
              {report.status}
            </span>
            <span
              className="text-sm ml-auto"
              style={{ color: "var(--foreground)", opacity: 0.7 }}
            >
              {new Date(
                report.createdAt || report.timestamp
              ).toLocaleString()}
            </span>
          </div>
          {isOpen ? (
            <ChevronUpIcon
              className="w-5 h-5"
              style={{ color: "var(--foreground)", opacity: 0.5 }}
            />
          ) : (
            <ChevronDownIcon
              className="w-5 h-5"
              style={{ color: "var(--foreground)", opacity: 0.5 }}
            />
          )}
        </button>
        {isOpen && (
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mb-2">
              <span className="font-semibold">Details:</span>{" "}
              {report.additionalDetails}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Reported User:</span>{" "}
              {report.reportedUser?.username} ({report.reportedUser?.email})
            </div>
            <div className="mb-2">
              <span className="font-semibold">Reporting User:</span>{" "}
              {report.reportingUser?.username} ({report.reportingUser?.email})
            </div>
            <div className="mb-2">
              <span className="font-semibold">Platform:</span> {report.platform}
            </div>
            <div className="mb-2">
              <span className="font-semibold">App Version:</span>{" "}
              {report.appVersion}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Report ID:</span>{" "}
              {report.reportId}
            </div>
            {showResolve && (
              <button
                className="mt-4 px-4 py-2 rounded hover:bg-green-700 transition"
                style={{ background: "#22c55e", color: "#fff" }}
                onClick={() => handleMarkResolved(report.reportId)}
              >
                Mark as Resolved
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {user && <DashboardNavBar user={user} />}
      <div className="flex flex-1">
        <DashboardSideNav />
        <main className="flex-1 p-8">
          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--foreground)" }}
          >
            All Reports
          </h1>
          <section className="mb-12">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Pending Reports
            </h2>
            {pendingReports.length === 0 ? (
              <div style={{ color: "var(--foreground)" }}>No pending reports.</div>
            ) : (
              <div className="space-y-6">
                {pendingReports.map((report) =>
                  renderReportCard(report, true)
                )}
              </div>
            )}
          </section>
          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Resolved Reports
            </h2>
            {resolvedReports.length === 0 ? (
              <div style={{ color: "var(--foreground)" }}>No resolved reports.</div>
            ) : (
              <div className="space-y-6">
                {resolvedReports.map((report) =>
                  renderReportCard(report, false)
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
