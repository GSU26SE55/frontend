import { useEffect, useReducer } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronLeft } from "lucide-react";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import ResetOtpVerifyForm from "@/features/auth/components/ResetOtpVerifyForm";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { cn } from "@/lib/utils";

// Fallback nếu BE không trả expiresInSeconds (api-auth.md: resetToken TTL 900s = 15 phút)
const RESET_TOKEN_TTL_FALLBACK_S = 900;

const STEPS = [
  { label: "Email" },
  { label: "Xác thực" },
  { label: "Mật khẩu" },
] as const;

type ForgotPasswordStep = 1 | 2 | 3;

interface ForgotPasswordState {
  step: ForgotPasswordStep;
  email: string;
  resetToken: string;
  tokenExpiry: number | null;
  countdown: number;
}

type ForgotPasswordAction =
  | { type: "OTP_REQUESTED"; email: string }
  | { type: "OTP_VERIFIED"; resetToken: string; tokenExpiry: number }
  | { type: "TOKEN_TICK"; countdown: number }
  | { type: "RESET_FLOW" };

const initialState: ForgotPasswordState = {
  step: 1,
  email: "",
  resetToken: "",
  tokenExpiry: null,
  countdown: 0,
};

const forgotPasswordReducer = (
  state: ForgotPasswordState,
  action: ForgotPasswordAction,
): ForgotPasswordState => {
  switch (action.type) {
    case "OTP_REQUESTED":
      return { ...state, step: 2, email: action.email };
    case "OTP_VERIFIED":
      return {
        ...state,
        step: 3,
        resetToken: action.resetToken,
        tokenExpiry: action.tokenExpiry,
        countdown: Math.max(
          0,
          Math.ceil((action.tokenExpiry - Date.now()) / 1000),
        ),
      };
    case "TOKEN_TICK":
      return { ...state, countdown: action.countdown };
    case "RESET_FLOW":
      return initialState;
    default:
      return state;
  }
};

const STEP_META = {
  1: {
    title: "Quên mật khẩu",
    desc: "Nhập email để nhận mã OTP đặt lại mật khẩu",
  },
  2: {
    title: "Nhập mã OTP",
    desc: "Mã xác thực đã được gửi đến email của bạn",
  },
  3: { title: "Mật khẩu mới", desc: "Đặt mật khẩu mới cho tài khoản của bạn" },
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(forgotPasswordReducer, initialState);

  useEffect(() => {
    if (state.step !== 3 || state.tokenExpiry === null) return;
    const tokenExpiry = state.tokenExpiry;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((tokenExpiry - Date.now()) / 1000),
      );
      if (remaining === 0) {
        toast.error("Mã xác thực đã hết hạn, vui lòng thử lại.");
        dispatch({ type: "RESET_FLOW" });
        return true;
      }
      dispatch({ type: "TOKEN_TICK", countdown: remaining });
      return false;
    };
    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [state.step, state.tokenExpiry]);

  const formattedCountdown = `${Math.floor(state.countdown / 60)}:${String(state.countdown % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => {
          const stepNum = (i + 1) as ForgotPasswordStep;
          const isCompleted = state.step > stepNum;
          const isActive = state.step === stepNum;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5 stroke-[2.5]" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    isActive ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-px w-14 mx-1 transition-colors duration-300",
                    state.step > stepNum ? "bg-emerald-500" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Title + description */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {STEP_META[state.step].title}
        </h1>
        <p className="text-sm text-slate-500">{STEP_META[state.step].desc}</p>
        {state.step === 3 && state.countdown > 0 && (
          <p className="text-xs font-semibold text-amber-500">
            Mã hết hạn sau: {formattedCountdown}
          </p>
        )}
      </div>

      {/* Form */}
      <div>
        {state.step === 1 && (
          <ForgotPasswordForm
            onSuccess={(email) => dispatch({ type: "OTP_REQUESTED", email })}
          />
        )}
        {state.step === 2 && (
          <ResetOtpVerifyForm
            email={state.email}
            onSuccess={(token, expiresInSeconds) =>
              dispatch({
                type: "OTP_VERIFIED",
                resetToken: token,
                tokenExpiry:
                  Date.now() +
                  (expiresInSeconds || RESET_TOKEN_TTL_FALLBACK_S) * 1000,
              })
            }
          />
        )}
        {state.step === 3 && (
          <ResetPasswordForm
            resetToken={state.resetToken}
            onSuccess={() => navigate("/login", { replace: true })}
          />
        )}
      </div>

      {/* Back to login */}
      <div className="pt-1 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
