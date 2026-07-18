import { UserRole } from "@/shared/enums/session.enum";
import { jwtDecode } from "jwt-decode";
export { UserRole } from "@/shared/enums/session.enum";
interface JwtPayload {
  jti: string;
  nameid: string;
  AccountId: string;
  email: string;
  FullName: string;
  role: string;
  perm: string[];
  nbf: number;
  exp: number;
  iat: number;
}

export interface SessionUser {
  accountId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
}

export const decodeToken = (token: string): SessionUser => {
  const payload = jwtDecode<JwtPayload>(token);
  return {
    accountId: payload.AccountId,
    email: payload.email,
    fullName: payload.FullName,
    role: payload.role.toUpperCase() as UserRole,
    permissions: payload.perm ?? [],
  };
};

export const redirectByRole = (role: UserRole): string =>
  (
    ({
      ADMIN: "/admin",
      MANAGER: "/manager",
      STAFF: "/staff",
      CUSTOMER: "/use-mobile-app",
    }) as Record<UserRole, string>
  )[role] ?? "/unauthorized";
