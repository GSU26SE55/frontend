import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MapPin } from 'lucide-react';
import Sidebar, { type NavSection } from './Sidebar';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { UserRole } from '@/shared/types/session.types';

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tổng quan',     path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Quản lý',
    items: [
      { label: 'Danh sách Site', path: '/admin/sites', icon: MapPin },
    ],
  },
];

const MANAGER_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tổng quan',     path: '/manager/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Quản lý',
    items: [
      { label: 'Danh sách Site', path: '/manager/sites', icon: MapPin },
    ],
  },
];

export default function AppLayout() {
  const role = useSessionStore((s) => s.user?.role);

  const sections =
    role === UserRole.ADMIN   ? ADMIN_NAV   :
    role === UserRole.MANAGER ? MANAGER_NAV :
    [];

  const appName =
    role === UserRole.ADMIN   ? 'Admin Portal'   :
    role === UserRole.MANAGER ? 'Manager Portal' :
    'Portal';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar appName={appName} sections={sections} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
