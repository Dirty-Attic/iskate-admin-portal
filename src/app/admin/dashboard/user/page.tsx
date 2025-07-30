'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app as firebaseApp } from '@/utils/firebase';
import DashboardNavBar from '@/components/DashboardNavBar';
import DashboardSideNav from '@/components/DashboardSideNav';
import { useUser } from '@/context/UserContext';
import UserActionMenu from '@/components/UserActionMenu';
import { banUser, suspendUser, unsuspendUser } from '@/services/adminService';
import ManagerRolesModal from '@/components/ManagerRolesModal';

const db = getFirestore(firebaseApp);

type SortOption = 'username' | 'uid' | 'roles';

type UserStatus = {
  banned?: boolean;
  suspended?: boolean;
  reason?: string;
  bannedAt?: any;
  suspendedAt?: any;
  unsuspendDate?: any;
};

type User = import('@/context/UserContext').User & {
  status?: UserStatus;
};

export default function UserManagementPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('username');
  const [filter, setFilter] = useState<'all' | 'admin' | 'mod' | 'owner'>('all');
  const [rolesMap, setRolesMap] = useState<Record<string, string[]>>({});

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
        // Sort by role rank, then username
        const rankA = getRoleRank(rolesMap[a.uid] || []);
        const rankB = getRoleRank(rolesMap[b.uid] || []);
        if (rankA !== rankB) return rankB - rankA;
        return (a.username ?? '').localeCompare(b.username ?? '');
      }
      return 0;
    });

  const bannedUsers = users.filter(u => u.status?.banned);
  const suspendedUsers = users.filter(u => u.status?.suspended);

  // Track which action menu is open and its direction
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const [openUpMap, setOpenUpMap] = useState<Record<string, boolean>>({});

  const handleMenuOpen = (uid: string, openUp: boolean) => {
    setOpenMenuUid(uid);
    setOpenUpMap(prev => ({ ...prev, [uid]: openUp }));
  };
  const handleMenuClose = () => setOpenMenuUid(null);

  // Modal state
  const [manageRolesUid, setManageRolesUid] = useState<string | null>(null);

  // Get current user's roles
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
            <select value={sort} onChange={e => setSort(e.target.value as SortOption)} className="border px-3 py-2 rounded" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              <option value="username">Sort by Username</option>
              <option value="uid">Sort by UID</option>
              <option value="roles">Sort by Roles</option>
            </select>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border px-3 py-2 rounded" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="mod">Mod</option>
              <option value="owner">Owner</option>
            </select>
          </section>
          {loading ? (
            <div>Loading users...</div>
          ) : (
            <>
              <div className="overflow-x-auto mb-12">
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Active Users</h2>
                <table className="min-w-full border rounded shadow" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Photo</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Username</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>UID</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Roles</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.uid} style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.username ?? ''} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: 'var(--border)' }} />
                          ) : (
                            <span className="inline-block w-10 h-10 rounded-full border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }} />
                          )}
                        </td>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>{u.username}</td>
                        <td className="px-4 py-2 border-b font-mono text-xs" style={{ borderColor: 'var(--border)' }}>{u.uid}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                          {rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : '—'}
                        </td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                          <UserActionMenu
                            isOpen={openMenuUid === u.uid}
                            openUp={openUpMap[u.uid] || false}
                            onOpen={openUp => openMenuUid === u.uid ? handleMenuClose() : handleMenuOpen(u.uid, openUp)}
                          onBan={async () => {
                            handleMenuClose();
                            if (window.confirm(`Ban user ${u.username || u.uid}?`)) {
                              const reason = window.prompt('Reason for ban?', '');
                              await banUser(u.uid, reason || undefined);
                              alert('User banned');
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
                              alert(`User suspended until ${until.toLocaleDateString()}`);
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
                {filteredUsers.length === 0 && <div className="mt-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>No users found.</div>}
              </div>

              <div className="overflow-x-auto mb-12">
                <h2 className="text-lg font-semibold mb-2 text-red-600" style={{ color: 'var(--foreground)' }}>Banned Users</h2>
                <table className="min-w-full border rounded shadow" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Photo</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Username</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>UID</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Roles</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Reason</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map(u => (
                      <tr key={u.uid} style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.username ?? ''} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: 'var(--border)' }} />
                          ) : (
                            <span className="inline-block w-10 h-10 rounded-full border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }} />
                          )}
                        </td>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>{u.username}</td>
                        <td className="px-4 py-2 border-b font-mono text-xs" style={{ borderColor: 'var(--border)' }}>{u.uid}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>{rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : '—'}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>{u.status?.reason || ''}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                          <button
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-black font-semibold shadow hover:scale-105 hover:from-green-500 hover:to-green-700 transition-transform duration-150"
                            title="Unban user"
                            onClick={async () => {
                              if (window.confirm(`Unban user ${u.username || u.uid}?`)) {
                                await unsuspendUser(u.uid);
                                alert('User unbanned');
                                await fetchUsers();
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                            <span>Unban</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bannedUsers.length === 0 && <div className="mt-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>No banned users.</div>}
              </div>

              <div className="overflow-x-auto mb-12">
                <h2 className="text-lg font-semibold mb-2 text-yellow-600" style={{ color: 'var(--foreground)' }}>Suspended Users</h2>
                <table className="min-w-full border rounded shadow" style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Photo</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Username</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>UID</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Roles</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Reason</th>
                      <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>Unsuspend Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspendedUsers.map(u => (
                      <tr key={u.uid} style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.username ?? ''} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: 'var(--border)' }} />
                          ) : (
                            <span className="inline-block w-10 h-10 rounded-full border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }} />
                          )}
                        </td>
                        <td className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>{u.username}</td>
                        <td className="px-4 py-2 border-b font-mono text-xs" style={{ borderColor: 'var(--border)' }}>{u.uid}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>{rolesMap[u.uid]?.length ? rolesMap[u.uid].join(', ') : '—'}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>{u.status?.reason || ''}</td>
                        <td className="px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                          {u.status?.unsuspendDate?.toDate ? u.status.unsuspendDate.toDate().toLocaleDateString() : ''}
                          <button
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-black font-semibold shadow hover:scale-105 hover:from-green-500 hover:to-green-700 transition-transform duration-150 ml-2"
                            title="Unsuspend user"
                            onClick={async () => {
                              if (window.confirm(`Unsuspend user ${u.username || u.uid} early?`)) {
                                await unsuspendUser(u.uid);
                                alert('User unsuspended');
                                await fetchUsers();
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                            <span>Unsuspend</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {suspendedUsers.length === 0 && <div className="mt-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>No suspended users.</div>}
              </div>
            </>
          )}
          {/* Manage Roles Modal */}
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

// Helper to get role rank
function getRoleRank(roles: string[]) {
  if (roles.includes('owner')) return 3;
  if (roles.includes('admin')) return 2;
  if (roles.includes('mod')) return 1;
  return 0;
}
