import { Outlet } from 'react-router-dom';
import logoImg from '@/assets/logo.png';

const AuthLayout = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
    {/* Background grid accent */}
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundImage:
          'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.45,
      }}
    />
    {/* Emerald glow center-top */}
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 h-72 w-[600px] rounded-full bg-emerald-400/10 blur-[80px]"
    />

    {/* Logo header */}
    <div className="relative z-10 mb-7 flex flex-col items-center gap-2">
      <img src={logoImg} alt="Sunaria" className="h-16 w-16 object-contain" />
      <div className="text-center">
        <p className="text-sm font-bold tracking-tight text-slate-900">Sunaria</p>
        <p className="text-xs text-slate-400">Solar Battery Management</p>
      </div>
    </div>

    {/* Card */}
    <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Outlet />
    </div>

    <p className="relative z-10 mt-8 text-xs text-slate-400">
      © 2026 Sunaria · Solar Battery System
    </p>
  </div>
);

export default AuthLayout;
