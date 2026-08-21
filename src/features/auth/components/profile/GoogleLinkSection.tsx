import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLinkGoogle } from "@/features/auth/hooks/account/useLinkGoogle";
import { useUnlinkGoogle } from "@/features/auth/hooks/account/useUnlinkGoogle";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

interface GoogleLinkSectionProps {
  isLinked: boolean;
  bare?: boolean;
}

const GoogleLinkSection = ({ isLinked, bare }: GoogleLinkSectionProps) => {
  const { mutate: linkGoogle } = useLinkGoogle();
  const { mutate: unlinkGoogle, isPending: isUnlinking } = useUnlinkGoogle();

  const handleUnlink = () => {
    unlinkGoogle(undefined, {
      onSuccess: () => toast.success(AUTH_MESSAGES.google.unlinked),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const inner = (
    <div className="flex items-center gap-2">
      {!isLinked ? (
        // Provider scoped here (not app-wide) so the Google GSI script loads only when
        // the link button actually renders — keeps it off every other page.
        // locale must sit on the provider (GoogleLogin reads it from context, not props);
        // without it GSI follows the browser language and renders "Đăng nhập".
        <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID} locale="en">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                linkGoogle(
                  { idToken: credentialResponse.credential },
                  {
                    onSuccess: () => toast.success(AUTH_MESSAGES.google.linked),
                    onError: (error) => handleErrorApi({ error }),
                  },
                );
              }
            }}
            onError={() => {
              toast.error(AUTH_MESSAGES.google.loginFailed);
            }}
            text="signin"
            shape="rectangular"
            theme="outline"
            size="medium"
          />
        </GoogleOAuthProvider>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnlink}
          disabled={isUnlinking}
        >
          {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Unlink
        </Button>
      )}
    </div>
  );

  if (bare) return inner;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Google account</CardTitle>
      </CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
};

export default GoogleLinkSection;
