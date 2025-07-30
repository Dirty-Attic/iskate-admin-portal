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

  function isFirestoreTimestamp(obj: unknown): obj is Timestamp {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'toDate' in obj &&
      typeof (obj as { toDate: () => Date }).toDate === 'function'
    );
  }

  function formatUnsuspendDate(date: Timestamp | Date | string | null | undefined) {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toLocaleDateString();
    if (isFirestoreTimestamp(date)) {
      return date.toDate().toLocaleDateString();
    }
    return String(date);
  }

  // Fetch users helper
  const fetchUsers = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'users'));

    const userList: User[] = [];
    const roles: Record<string, string[]> = {};

    // Parallelize everything
    await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;

      userList.push({
        uid,
        username: data.username ?? '',
        photoURL: data.photoURL ?? null,
        status: data.status ?? {},
      });

      // Parallelize role subcollection checks
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

  // Filter, search, and sort logic
  const filteredUsers = users
    .filter(u => {
      if (filter === 'all') return true;
      return rolesMap[u.uid]?.includes(filter);
    })
    .filter(u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid.toLowerCase().includes(search.toLowerCase())
    )
    .filter(u => !(u.status?.banned || u.status?.suspended))
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

  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const [openUpMap, setOpenUpMap] = useState<Record<string, boolean>>({});

  const handleMenuOpen = (uid: string, openUp: boolean) => {
    setOpenMenuUid(uid);
    setOpenUpMap(prev => ({ ...prev, [uid]: openUp }));
  };
  const handleMenuClose = () => setOpenMenuUid(null);

  const [manageRolesUid, setManageRolesUid] = useState<string | null>(null);
  const currentUserRoles = user ? rolesMap[user.uid] || [] : [];

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
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>User Management</h1>
          <section className="mb-6 flex gap-4 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search by username or UID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-64"
              style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="border px-3 py-2 rounded"
              style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="username">Sort by Username</option>
              <option value="uid">Sort by UID</option>
              <option value="roles">Sort by Roles</option>
            </select>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as FilterOption)}
              className="border px-3 py-2 rounded"
              style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="mod">Mod</option>
              <option value="owner">Owner</option>
            </select>
          </section>

          {/* ...rest of your tables and modal remain unchanged */}
        </main>
      </div>
    </div>
  );
}

// Helper to get role rank
function getRoleRank(roles: string[]) {
  if (roles.includes('owner')) return 3;
  if (roles.includes('admin')) return 2;
  if (roles.includes('mod')) return 1;
  return 0;
}
