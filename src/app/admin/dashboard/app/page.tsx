'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import DashboardNavBar from '@/components/DashboardNavBar';
import DashboardSideNav from '@/components/DashboardSideNav';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app as firebaseApp } from '@/utils/firebase';

const db = getFirestore(firebaseApp);

export default function AppManagementPage() {
  const { user } = useUser();
  const [appActive, setAppActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        // Check owner role
        const ownerDocRef = doc(db, `users/${user.uid}/roles/owner`);
        const ownerDocSnap = await getDoc(ownerDocRef);
        console.log('Owner role snapshot:', ownerDocSnap.exists() ? ownerDocSnap.data() : 'No owner doc');
        if (!ownerDocSnap.exists()) {
          setIsOwner(false);
          setError('Owner role document not found. Danger Zone hidden.');
        } else {
          const ownerData = ownerDocSnap.data();
          if (ownerData.active === true) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
            setError('Owner role is not active. Danger Zone hidden.');
          }
        }

        // Get app status
        const appDocRef = doc(db, 'app/main');
        const appDocSnap = await getDoc(appDocRef);
        console.log('App status snapshot:', appDocSnap.exists() ? appDocSnap.data() : 'No app doc');
        if (appDocSnap.exists()) {
          setAppActive(appDocSnap.data().active === true);
        } else {
          setAppActive(null);
          setError('App document not found.');
        }
      } catch (err) {
        setError('Failed to load app status or owner role.');
        console.error('Error fetching owner/app status:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  async function handleToggleActive() {
    if (!user) return;
    setToggleLoading(true);
    setError(null);
    try {
      const appDocRef = doc(db, 'app/main');
      await updateDoc(appDocRef, { active: !appActive });
      setAppActive(!appActive);
    } catch {
      setError('Failed to update app status.');
    } finally {
      setToggleLoading(false);
    }
  }

  if (!user) return <div>Loading...</div>;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <DashboardNavBar user={user} />
      <div className="flex flex-1">
        <DashboardSideNav />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>App Management</h1>
          <section className="mb-8">
            <p style={{ color: 'var(--foreground)', opacity: 0.8 }}>Manage app settings and status here.</p>
          </section>
          {isOwner && appActive !== null && (
            <section
              className="mt-12 border rounded-lg p-6 max-w-xl"
              style={{
                background: appActive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: appActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              }}
            >
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: appActive ? 'var(--foreground)' : '#dc2626' }}
              >
                Danger Zone
              </h2>
              <p className="mb-4" style={{ color: '#dc2626' }}>
                This area is only visible to owners. Use with caution!
              </p>
              <div className="flex items-center gap-4">
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    background: appActive ? 'rgba(16,185,129,0.15)' : 'rgba(55,65,81,0.15)',
                    color: appActive ? '#059669' : 'var(--foreground)',
                  }}
                >
                  {appActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                  }}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to ${appActive ? 'deactivate' : 'reactivate'} the app? This action cannot be easily undone.`
                      )
                    ) {
                      handleToggleActive();
                    }
                  }}
                  disabled={toggleLoading}
                >
                  {appActive ? 'Kill Switch (Deactivate App)' : 'Reactivate App'}
                </button>
              </div>
              {error && (
                <div className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                  {error}
                </div>
              )}
            </section>
          )}
          {/* Only show error if it's not owner-related */}
          {!isOwner && !loading && error === 'Failed to load app status or owner role.' && (
            <div className="mt-8 text-sm" style={{ color: '#dc2626' }}>{error}</div>
          )}
          {loading && <div className="mt-8">Loading app status...</div>}
        </main>
      </div>
    </div>
  );
}
