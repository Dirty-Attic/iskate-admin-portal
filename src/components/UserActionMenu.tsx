import { useRef } from 'react';

export type UserActionMenuProps = {
  onBan: () => void;
  onSuspend: () => void;
  onManageRoles: () => void;
  isOpen: boolean;
  openUp: boolean;
  onOpen: (openUp: boolean) => void;
};

export default function UserActionMenu({ onBan, onSuspend, onManageRoles, isOpen, openUp, onOpen }: UserActionMenuProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // If there's less than 200px below, open upwards
      onOpen(window.innerHeight - rect.bottom < 200);
    } else {
      onOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        className="p-2 rounded-full"
        style={{
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,250,251,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={handleOpen}
        aria-label="User actions"
      >
        <span className="text-2xl">&#8230;</span>
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 w-40 rounded shadow-lg z-10 border ${openUp ? 'bottom-10 mb-2' : 'mt-2'}`}
          style={{
            background: 'var(--background)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
        >
          <button
            className="block w-full text-left px-4 py-2 rounded"
            style={{ color: 'var(--foreground)', background: 'transparent', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(243,244,246,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={onBan}
          >Ban User</button>
          <button
            className="block w-full text-left px-4 py-2 rounded"
            style={{ color: 'var(--foreground)', background: 'transparent', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(243,244,246,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={onSuspend}
          >Suspend User</button>
          <button
            className="block w-full text-left px-4 py-2 rounded"
            style={{ color: 'var(--foreground)', background: 'transparent', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(243,244,246,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={onManageRoles}
          >Manage Roles</button>
        </div>
      )}
    </div>
  );
}
