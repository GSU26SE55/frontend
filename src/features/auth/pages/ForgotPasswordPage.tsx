import { useEffect, useReducer } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ForgotPasswordForm from "@/features/auth/components/password/ForgotPasswordForm";
import ResetOtpVerifyForm from "@/features/auth/components/otp/ResetOtpVerifyForm";
import ResetPasswordForm from "@/features/auth/components/password/ResetPasswordForm";
import { cn } from "@/lib/utils";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";
import { DUR, SPRING } from "@/shared/motion/tokens";

// Fallback if BE doesn't return expiresInSeconds (api-auth.md: resetToken TTL 900s = 15 minutes)
const RESET_TOKEN_TTL_FALLBACK_S = 900;

const STEPS = [
  { label: "Email" },
  { label: "Verify" },
  { label: "Password" },
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
    title: "Forgot password",
    desc: "Enter your email to receive a password reset OTP",
  },
  2: {
    title: "Enter OTP",
    desc: "A verification code has been sent to your email",
  },
  3: { title: "New password", desc: "Set a new password for your account" },
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
        toast.error(AUTH_MESSAGES.otp.expired);
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
  const reduced = useReducedMotion();

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
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] duration-(--motion-enter) ease-strong",
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isCompleted ? (
                      <motion.span
                        key="check"
                        initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: SPRING }}
                      >
                        <Check className="size-3.5 stroke-[2.5]" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="num"
                        initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: SPRING }}
                        exit={{
                          opacity: 0,
                          transition: { duration: DUR.state },
                        }}
                      >
                        {stepNum}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={cn(
                    "text-2xs font-medium whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                /* Draws left-to-right with clip-path instead of swapping colour: the
                   line reads as progress being made, not as a value flipping. */
                <div className="relative mb-5 mx-1 h-px w-14 bg-border">
                  <div
                    className={cn(
                      "absolute inset-0 bg-emerald-500 transition-[clip-path] duration-(--motion-layout) ease-strong-in-out",
                      state.step > stepNum
                        ? "[clip-path:inset(0_0_0_0)]"
                        : "[clip-path:inset(0_100%_0_0)]",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Title + description */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {STEP_META[state.step].title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {STEP_META[state.step].desc}
        </p>
        {state.step === 3 && state.countdown > 0 && (
          <p className="text-xs font-semibold text-amber-500">
            Code expires in: {formattedCountdown}
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Back to log in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
