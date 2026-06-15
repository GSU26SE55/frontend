import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLinkGoogle } from "@/features/auth/hooks/useLinkGoogle";
import { useUnlinkGoogle } from "@/features/auth/hooks/useUnlinkGoogle";
import { handleErrorApi } from "@/shared/lib/errors";

interface GoogleLinkSectionProps {
  isLinked: boolean;
}

const GoogleLinkSection = ({ isLinked }: GoogleLinkSectionProps) => {
  const { mutate: linkGoogle, isPending: isLinking } = useLinkGoogle();
  const { mutate: unlinkGoogle, isPending: isUnlinking } = useUnlinkGoogle();

  const googleLogin = useGoogleLogin({
    onSuccess: (response: { access_token: string }) => {
      linkGoogle(
        { idToken: response.access_token },
        {
          onSuccess: () => toast.success("Liên kết Google thành công"),
          onError: (error) => handleErrorApi({ error }),
        },
      );
    },
    onError: () => toast.error("Đăng nhập Google thất bại"),
  });

  const handleUnlink = () => {
    unlinkGoogle(undefined, {
      onSuccess: () => toast.success("Hủy liên kết Google thành công"),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liên kết Google</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {isLinked
            ? "Tài khoản đã liên kết với Google."
            : "Chưa liên kết với Google."}
        </p>
        {!isLinked ? (
          <Button
            onClick={() => googleLogin()}
            disabled={isLinking}
            variant="outline"
          >
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Liên kết Google
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={handleUnlink}
            disabled={isUnlinking}
          >
            {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hủy liên kết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleLinkSection;
