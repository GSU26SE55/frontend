import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OtpVerifyForm from "@/features/auth/components/OtpVerifyForm";

const OtpVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email as string | undefined;

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  return <OtpVerifyForm email={email} />;
};

export default OtpVerifyPage;
