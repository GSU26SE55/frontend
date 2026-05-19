import { Outlet } from 'react-router-dom';
import { BatteryCharging } from 'lucide-react';

const AuthLayout = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.97_0.005_260)] px-4 py-12">
    <div className="mb-8 flex flex-col items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <BatteryCharging className="size-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight text-foreground">Solar Battery System</p>
        <p className="text-xs text-muted-foreground">Maintenance Management Platform</p>
      </div>
    </div>

    <div className="w-full max-w-md">
      <Outlet />
    </div>

    <p className="mt-8 text-xs text-muted-foreground">© 2026 Solar Battery System</p>
  </div>
);

export default AuthLayout;
