import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLinkGoogle } from "@/features/auth/hooks/useLinkGoogle";
import { useUnlinkGoogle } from "@/features/auth/hooks/useUnlinkGoogle";
import { handleErrorApi } from "@/shared/lib/errors";

interface GoogleLinkSectionProps {
  isLinked: boolean;
  bare?: boolean;
}

const GoogleLinkSection = ({ isLinked, bare }: GoogleLinkSectionProps) => {
  const { mutate: linkGoogle } = useLinkGoogle();
  const { mutate: unlinkGoogle, isPending: isUnlinking } = useUnlinkGoogle();

  const handleUnlink = () => {
    unlinkGoogle(undefined, {
      onSuccess: () => toast.success("Hủy liên kết Google thành công"),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const inner = (
    <div className="flex items-center gap-2">
      {!isLinked ? (
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              linkGoogle(
                { idToken: credentialResponse.credential },
                {
                  onSuccess: () => toast.success("Liên kết Google thành công"),
                  onError: (error) => handleErrorApi({ error }),
                },
              );
            }
          }}
          onError={() => {
            toast.error("Đăng nhập Google thất bại");
          }}
          text="signin"
          shape="rectangular"
          theme="outline"
          size="medium"
        />
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnlink}
          disabled={isUnlinking}
        >
          {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Hủy liên kết
        </Button>
      )}
    </div>
  );

  if (bare) return inner;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liên kết Google</CardTitle>
      </CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
};

export default GoogleLinkSection;
