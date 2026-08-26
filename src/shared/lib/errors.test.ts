import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a) },
}));

const { EntityError, HttpError, handleErrorApi } =
  await import("@/shared/lib/errors");
const { MESSAGES } = await import("@/shared/constants/messages");

describe("handleErrorApi", () => {
  beforeEach(() => {
    toastError.mockClear();
  });

  it("lỗi validation được gắn xuống đúng từng ô nhập, không hiện toast", () => {
    const setError = vi.fn();
    const error = new EntityError([
      { field: "email", detail: "Email đã tồn tại." },
      { field: "password", detail: "Mật khẩu quá ngắn." },
    ]);

    handleErrorApi({ error, setError });

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(1, "email", {
      type: "server",
      message: "Email đã tồn tại.",
    });
    expect(setError).toHaveBeenNthCalledWith(2, "password", {
      type: "server",
      message: "Mật khẩu quá ngắn.",
    });
    // Lỗi đã hiện ngay dưới ô nhập; thêm toast là nói hai lần cùng một chuyện.
    expect(toastError).not.toHaveBeenCalled();
  });

  it("lỗi validation ở màn không có form thì im lặng, không nổ", () => {
    const error = new EntityError([
      { field: "email", detail: "Sai định dạng." },
    ]);
    expect(() => handleErrorApi({ error })).not.toThrow();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("lỗi HTTP thường hiện toast với thông điệp của backend", () => {
    handleErrorApi({
      error: new HttpError(403, "Bạn không có quyền thực hiện."),
    });
    expect(toastError).toHaveBeenCalledWith("Bạn không có quyền thực hiện.");
  });

  it("lỗi HTTP vẫn hiện toast kể cả khi màn hình có form", () => {
    const setError = vi.fn();
    handleErrorApi({ error: new HttpError(500, "Máy chủ lỗi."), setError });
    expect(setError).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Máy chủ lỗi.");
  });

  // Lỗi mạng, lỗi cú pháp, promise bị reject bằng chuỗi — người dùng vẫn phải thấy một câu.
  it.each([new Error("boom"), "chuỗi trần", null, undefined, { message: "x" }])(
    "thứ không phải HttpError (%s) rơi về thông điệp chung",
    (error) => {
      handleErrorApi({ error });
      expect(toastError).toHaveBeenCalledWith(MESSAGES.unknownError);
    },
  );
});

describe("phân cấp lớp lỗi", () => {
  it("EntityError vẫn là một HttpError", () => {
    const error = new EntityError([]);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
  });

  it("EntityError mặc định mang mã 422", () => {
    expect(new EntityError([]).statusCode).toBe(422);
  });

  it("EntityError nhận mã khác khi backend trả mã khác", () => {
    expect(new EntityError([], 400).statusCode).toBe(400);
  });

  it("HttpError giữ nguyên mã và thông điệp", () => {
    const error = new HttpError(404, "Không tìm thấy.");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Không tìm thấy.");
    expect(error.name).toBe("HttpError");
  });
});
