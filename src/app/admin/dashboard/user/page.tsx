'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app as firebaseApp } from '@/utils/firebase';
import type { Timestamp } from 'firebase/firestore';
import DashboardNavBar from '@/components/DashboardNavBar';
import DashboardSideNav from '@/components/DashboardSideNav';
import { useUser } from '@/context/UserContext';
import UserActionMenu from '@/components/UserActionMenu';
import { banUser, suspendUser, unsuspendUser } from '@/services/adminService';
import ManagerRolesModal from '@/components/ManagerRolesModal';
import Image from "next/image";

const db = getFirestore(firebaseApp);

type SortOption = 'username' | 'uid' | 'roles';
type FilterOption = 'all' | 'admin' | 'mod' | 'owner';

type UserStatus = {
  banned?: boolean;
  suspended?: boolean;
  reason?: string;
  bannedAt?: Timestamp | Date | string | null;
  suspendedAt?: Timestamp | Date | string | null;
  unsuspendDate?: Timestamp | Date | string | null;
};

type User = import('@/context/UserContext').User & {
  status?: UserStatus;
};

export default function UserManagementPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('username');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [rolesMap, setRolesMap] = useState<Record<string, string[]>>({});

  function formatUnsuspendDate(date: Timestamp | Date | string | null | undefined) {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toLocaleDateString();
    if (
      typeof date === 'object' &&
      date !== null &&
      'toDate' in date &&
      typeof (date as Timestamp).toDate === 'function'
    ) {
      return (date as Timestamp).toDate().toLocaleDateString();
    }
    return String(date);
  }

  // Fetch users helper
  const fetchUsers = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'users'));

    const userList: User[] = [];
    const roles: Record<string, string[]> = {};

    await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;

      userList.push({
        uid,
        username: data.username ?? '',
        photoURL: data.photoURL ?? null,
        status: data.status ?? {},
      });

      const roleNames = ['admin', 'mod', 'owner'];
      const userRoles = await Promise.all(
        roleNames.map(async (role) => {
          const roleDoc = await getDoc(doc(db, `users/${uid}/roles/${role}`));
          return roleDoc.exists() && roleDoc.data().active ? role : null;
        })
      );

      roles[uid] = userRoles.filter(Boolean) as string[];
    }));

    setUsers(userList);
    setRolesMap(roles);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter, search, and sort logic for Active Users table
  const filteredUsers = users
    .filter(u => !u.status?.banned && !u.status?.suspended) // active only
    .filter(u => {
      if (filter === 'all') return true;
      return rolesMap[u.uid]?.includes(filter);
    })
    .filter(u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'username') {
        return (a.username ?? '').localeCompare(b.username ?? '');
      } else if (sort === 'uid') {
        return a.uid.localeCompare(b.uid);
      } else if (sort === 'roles') {
        const rankA = getRoleRank(rolesMap[a.uid] || []);
        const rankB = getRoleRank(rolesMap[b.uid] || []);
        if (rankA !== rankB) return rankB - rankA;
        return (a.username ?? '').localeCompare(b.username ?? '');
      }
      return 0;
    });

  const bannedUsers = users.filter(u => u.status?.banned);
  const suspendedUsers = users.filter(u => u.status?.suspended);

  // Menu states
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const [openUpMap, setOpenUpMap] = useState<Record<string, boolean>>({});
  const handleMenuOpen = (uid: string, openUp: boolean) => {
    setOpenMenuUid(uid);
    setOpenUpMap(prev => ({ ...prev, [uid]: openUp }));
  };
  const handleMenuClose = () => setOpenMenuUid(null);

  // Modal state
  const [manageRolesUid, setManageRolesUid] = useState<string | null>(null);
  const currentUserRoles = user ? rolesMap[user.uid] || [] : [];

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <DashboardNavBar user={user} />
      <div className="flex flex-1">
        <DashboardSideNav />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">User Management</h1>
          
          {/* Filters */}
          <section className="mb-6 flex gap-4 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search by username or UID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-64"
            />
            <select value={sort} onChange={e => setSort(e.target.value as SortOption)} className="border px-3 py-2 rounded">
              <option value="username">Sort by Username</option>
              <option value="uid">Sort by UID</option>
              <option value="roles">Sort by Roles</option>
            </select>
            <select value={filter} onChange={e => setFilter(e.target.value as FilterOption)} className="border px-3 py-2 rounded">
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="mod">Mod</option>
              <option value="owner">Owner</option>
            </select>
          </section>

          {/* Active Users Table */}
          <div className="overflow-x-auto mb-12">
            <h2 className="text-lg font-semibold mb-2">Active Users</h2>
            <table className="min-w-full border-separate border-spacing-0 rounded-xl shadow-lg bg-white dark:bg-zinc-900">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Photo</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">UID</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr
                    key={u.uid}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'} hover:bg-blue-50 dark:hover:bg-blue-900`}
                  >
                    <td className="px-4 py-3">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt={u.username ?? ''} width={40} height={40} className="rounded-full border" />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                    <td className="px-4 py-3">{rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : <span className="text-zinc-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <UserActionMenu
                        isOpen={openMenuUid === u.uid}
                        openUp={openUpMap[u.uid] || false}
                        onOpen={openUp => openMenuUid === u.uid ? handleMenuClose() : handleMenuOpen(u.uid, openUp)}
                        onBan={async () => {
                          handleMenuClose();
                          if (window.confirm(`Ban user ${u.username || u.uid}?`)) {
                            const reason = window.prompt('Reason for ban?', '');
                            await banUser(u.uid, reason || undefined);
                            await fetchUsers();
                          }
                        }}
                        onSuspend={async () => {
                          handleMenuClose();
                          const days = window.prompt('Suspend for how many days?', '7');
                          const numDays = days ? parseInt(days) : 0;
                          if (numDays > 0) {
                            const reason = window.prompt('Reason for suspension?', '');
                            const until = new Date();
                            until.setDate(until.getDate() + numDays);
                            await suspendUser(u.uid, until, reason || undefined);
                            await fetchUsers();
                          }
                        }}
                        onManageRoles={() => {
                          handleMenuClose();
                          setManageRolesUid(u.uid);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div className="mt-4 opacity-70">No active users found.</div>}
          </div>

          {/* Banned Users Table */}
          <div className="overflow-x-auto mb-12">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Banned Users</h2>
            <table className="min-w-full border-separate border-spacing-0 rounded-xl shadow-lg bg-white dark:bg-zinc-900">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Photo</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">UID</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bannedUsers.map((u, idx) => (
                  <tr
                    key={u.uid}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'} hover:bg-red-50 dark:hover:bg-red-900`}
                  >
                    <td className="px-4 py-3">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt={u.username ?? ''} width={40} height={40} className="rounded-full border" />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                    <td className="px-4 py-3">{rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : <span className="text-zinc-400">—</span>}</td>
                    <td className="px-4 py-3">{u.status?.reason}</td>
                    <td className="px-4 py-3">
                      <button
                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-black rounded-full font-semibold transition"
                        onClick={async () => {
                          if (window.confirm(`Unban ${u.username || u.uid}?`)) {
                            await unsuspendUser(u.uid);
                            await fetchUsers();
                          }
                        }}
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bannedUsers.length === 0 && <div className="mt-4 opacity-70">No banned users.</div>}
          </div>

          {/* Suspended Users Table */}
          <div className="overflow-x-auto mb-12">
            <h2 className="text-lg font-semibold mb-2 text-yellow-600">Suspended Users</h2>
            <table className="min-w-full border-separate border-spacing-0 rounded-xl shadow-lg bg-white dark:bg-zinc-900">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Photo</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">UID</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200">Unsuspend Date</th>
                </tr>
              </thead>
              <tbody>
                {suspendedUsers.map((u, idx) => (
                  <tr
                    key={u.uid}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'} hover:bg-yellow-50 dark:hover:bg-yellow-900`}
                  >
                    <td className="px-4 py-3">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt={u.username ?? ''} width={40} height={40} className="rounded-full border" />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                    <td className="px-4 py-3">{rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : <span className="text-zinc-400">—</span>}</td>
                    <td className="px-4 py-3">{u.status?.reason}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {formatUnsuspendDate(u.status?.unsuspendDate)}
                      <button
                        className="ml-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-black rounded-full font-semibold transition"
                        onClick={async () => {
                          if (window.confirm(`Unsuspend ${u.username || u.uid}?`)) {
                            await unsuspendUser(u.uid);
                            await fetchUsers();
                          }
                        }}
                      >
                        Unsuspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suspendedUsers.length === 0 && <div className="mt-4 opacity-70">No suspended users.</div>}
          </div>

          {manageRolesUid && (
            <ManagerRolesModal
              isOpen={!!manageRolesUid}
              onClose={async () => {
                setManageRolesUid(null);
                await fetchUsers();
              }}
              user={{
                uid: manageRolesUid,
                username: users.find(u => u.uid === manageRolesUid)?.username || manageRolesUid,
              }}
              currentRoles={rolesMap[manageRolesUid] || []}
              currentUserRoles={currentUserRoles}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function getRoleRank(roles: string[]) {
  if (roles.includes('owner')) return 3;
  if (roles.includes('admin')) return 2;
  if (roles.includes('mod')) return 1;
  return 0;
}
