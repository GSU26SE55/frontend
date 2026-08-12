import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";

// CUSTOMER accounts don't use the web app — every login flow (regular/2FA/invite/Google)
// redirects CUSTOMER here instead of letting them into the portal.
const UseMobileAppPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="size-7 text-primary" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight">
          Please use the mobile app
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer accounts can only log in through the mobile app to monitor
          batteries and create support requests. The web app is for Admin,
          Manager, and Staff.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to log in
        </Link>
      </div>
    </div>
  );
};

export default UseMobileAppPage;
