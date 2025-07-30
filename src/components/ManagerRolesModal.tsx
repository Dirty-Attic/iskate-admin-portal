import React, { useState } from 'react';
import { updateUserRole } from '@/services/adminService';

export type ManagerRolesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: {
    uid: string;
    username: string;
  };
  currentRoles: string[];
  currentUserRoles: string[];
};

export default function ManagerRolesModal({ isOpen, onClose, user, currentRoles, currentUserRoles }: ManagerRolesModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>(currentRoles);
  const isOwner = currentUserRoles.includes('owner');
  const isAdmin = currentUserRoles.includes('admin');

  const handleRoleChange = async (role: string, give: boolean) => {
    setLoading(true);
    await updateUserRole(user.uid, role, give);
    setRoles(prev => give ? [...prev, role] : prev.filter(r => r !== role));
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]" style={{ color: 'var(--foreground)', background: 'var(--card)' }}>
        <h2 className="text-xl font-bold mb-4">Manage Roles for {user.username}</h2>
        <div className="space-y-3 mb-4">
          {isAdmin && (
            <div className="flex items-center justify-between">
              <span>Mod</span>
              <button
                className={`px-3 py-1 rounded ${roles.includes('mod') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                disabled={loading}
                onClick={() => handleRoleChange('mod', !roles.includes('mod'))}
              >{roles.includes('mod') ? 'Remove Mod' : 'Give Mod'}</button>
            </div>
          )}
          {isOwner && (
            <div className="flex items-center justify-between">
              <span>Admin</span>
              <button
                className={`px-3 py-1 rounded ${roles.includes('admin') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                disabled={loading}
                onClick={() => handleRoleChange('admin', !roles.includes('admin'))}
              >{roles.includes('admin') ? 'Remove Admin' : 'Give Admin'}</button>
            </div>
          )}
        </div>
        <button className="mt-2 px-4 py-2 rounded bg-gray-300" onClick={onClose} disabled={loading}>Close</button>
      </div>
    </div>
  );
}
