import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Full-screen page for the two router-level dead ends: 403 (no permission) and 404 (no such
 * page). Both used to be inline JSX in the router with no way out — the user's only option
 * was the browser's own back button or retyping a URL.
 *
 * "Back" goes to the previous entry rather than a fixed route: arriving here is almost always
 * a mis-click or a mistyped address, so the place the user came from is where they want to
 * return. `navigate(-1)` is a no-op on a cold load straight into this URL (no history to pop),
 * so the home link stays beside it as the always-works escape.
 */
export default function ErrorPage({
  code,
  message,
  tone,
}: {
  code: string;
  message: string;
  /** 403 reads as a denial, 404 as a plain miss — only the former is colored destructive. */
  tone?: "destructive";
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1
          className={`text-4xl font-semibold ${
            tone === "destructive" ? "text-destructive" : ""
          }`}
        >
          {code}
        </h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
