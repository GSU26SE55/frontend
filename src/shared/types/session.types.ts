import { jwtDecode } from "jwt-decode";

export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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
      [UserRole.ADMIN]: "/admin",
      [UserRole.MANAGER]: "/manager",
      [UserRole.STAFF]: "/staff",
      [UserRole.CUSTOMER]: "/unauthorized",
    }) as Record<UserRole, string>
  )[role] ?? "/unauthorized";
