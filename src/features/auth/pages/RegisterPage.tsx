import { useNavigate } from "react-router-dom";
import RegisterForm from "@/features/auth/components/RegisterForm";

const RegisterPage = () => {
  const navigate = useNavigate();
  return (
    <RegisterForm
      onLogin={() => navigate("/login")}
      onOtpSent={(email) =>
        navigate("/register/verify-otp", { state: { email } })
      }
    />
  );
};

export default RegisterPage;
