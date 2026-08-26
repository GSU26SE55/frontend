import type { AnimationParams } from "animejs";

/**
 * Giá trị hợp lệ cho một thuộc tính trong tham số của `animate()`.
 */
type AnimatablePropertyValue = AnimationParams[string];

/**
 * Bọc một giá trị tính theo từng phần tử — `(phần tử, chỉ số) => giá trị` — cho `animate()`.
 *
 * animejs 4.5.0 khai `AnimationParams` là
 * `Record<string, TweenOptions | Callback | TweenModifier | boolean | …Keyframes | ScrollObserver>`,
 * **thiếu `FunctionValue`**, dù `FunctionValue` được định nghĩa ngay trong cùng file khai báo
 * kiểu đó và giá trị theo từng phần tử là tính năng có tài liệu của thư viện. Hệ quả:
 * `width: (el, i) => …` không khớp thành viên nào của union, TypeScript thử tới `EasingFunction`
 * (nhận một tham số) rồi báo "Target signature provides too few arguments".
 *
 * Ép kiểu ở đúng một chỗ này thay vì rải `as never` ở từng chỗ gọi: khi animejs vá lại khai báo,
 * xoá hàm này là trình biên dịch chỉ ra ngay mọi nơi cần sửa. Phần chạy thật không đổi — animejs
 * vẫn nhận đúng hàm đó và gọi với `(target, index, targets)`.
 */
export const perTarget = <T>(
  fn: (element: HTMLElement, index: number) => T,
): AnimatablePropertyValue => fn as unknown as AnimatablePropertyValue;
