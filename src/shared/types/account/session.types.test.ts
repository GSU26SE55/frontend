import { describe, expect, it } from "vitest";
import {
  decodeToken,
  redirectByRole,
} from "@/shared/types/account/session.types";
import { UserRole } from "@/shared/enums/account/session.enum";

/** Ghép một JWT không ký — jwtDecode chỉ đọc phần payload, không kiểm chữ ký. */
const makeToken = (payload: Record<string, unknown>) => {
  const b64 = (o: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.chu-ky-gia`;
};

const basePayload = {
  jti: "jti-1",
  nameid: "acc-1",
  AccountId: "11111111-1111-1111-1111-111111111111",
  email: "manager@test.local",
  FullName: "Quản lý",
  role: "Manager",
  perm: ["ticket.view", "ticket.assign"],
  nbf: 0,
  exp: 0,
  iat: 0,
};

describe("decodeToken", () => {
  it("lấy đúng các trường phiên từ payload", () => {
    const user = decodeToken(makeToken(basePayload));

    expect(user.accountId).toBe("11111111-1111-1111-1111-111111111111");
    expect(user.email).toBe("manager@test.local");
    expect(user.fullName).toBe("Quản lý");
    expect(user.permissions).toEqual(["ticket.view", "ticket.assign"]);
  });

  // Backend phát vai trò dạng PascalCase ("Manager"), cả app dùng chữ hoa. Chuẩn hoá phải
  // xảy ra đúng một chỗ là đây; thiếu nó thì RoleRoute so sánh trượt và người dùng bị đá
  // sang /unauthorized ngay sau khi đăng nhập thành công.
  it.each([
    ["Admin", UserRole.ADMIN],
    ["Manager", UserRole.MANAGER],
    ["staff", UserRole.STAFF],
    ["cUsToMeR", UserRole.CUSTOMER],
  ])("chuẩn hoá vai trò %s về %s", (raw, expected) => {
    expect(decodeToken(makeToken({ ...basePayload, role: raw })).role).toBe(
      expected,
    );
  });

  // Tài khoản mới cấp có thể chưa gắn quyền nào; thiếu mảng perm không được làm sập màn hình.
  it("token thiếu perm trả về mảng rỗng thay vì undefined", () => {
    const withoutPerm: Record<string, unknown> = { ...basePayload };
    delete withoutPerm.perm;
    expect(decodeToken(makeToken(withoutPerm)).permissions).toEqual([]);
  });

  it("token hỏng thì ném lỗi để tầng gọi biết mà đăng xuất", () => {
    expect(() => decodeToken("khong-phai-jwt")).toThrow();
  });
});

describe("redirectByRole", () => {
  it.each([
    [UserRole.ADMIN, "/admin"],
    [UserRole.MANAGER, "/manager"],
    [UserRole.STAFF, "/staff"],
  ])("%s vào khu vực %s", (role, path) => {
    expect(redirectByRole(role)).toBe(path);
  });

  // Customer không có cổng web — đẩy sang trang hướng dẫn tải app, không phải /unauthorized.
  it("Customer được dẫn sang trang dùng ứng dụng di động", () => {
    expect(redirectByRole(UserRole.CUSTOMER)).toBe("/use-mobile-app");
  });

  it("vai trò lạ rơi về /unauthorized", () => {
    expect(redirectByRole("GUEST" as UserRole)).toBe("/unauthorized");
  });
});
