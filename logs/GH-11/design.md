# UI/UX Proposal — GH-11: Auth Flow

## Metadata
- **Status:** APPROVED — pending implementation
- **Issue:** #11 — https://github.com/GSU26SE55/frontend/issues/11
- **Ngày:** 2026-05-16
- **Skill:** `fe-ui-ux-master v4.0`
- **Mode:** A (Rebuild Existing Codebase)

---

## 0. Brand Reference (Design Grounding)

| | |
|--|--|
| **Reference brands** | Linear — clean SaaS auth, minimal, precise · Vercel — tech-forward, near-black, crisp forms |
| **Canvas** | White `oklch(1 0 0)` light · Near-black `oklch(0.10 0.02 250)` dark |
| **Primary accent** | Near-black `oklch(0.205 0 0)` — giữ nguyên, không thêm màu |
| **Typography** | Geist 600 heading · Geist 400 body (đã cài sẵn) |
| **Radius** | **Light** — `0.375rem` (6px), giảm từ `0.625rem` → không bo tròn quá |
| **Adaptation** | Solar/IoT monitoring system → tone "Clean Tech Minimal", monochrome |

---

## 1. Mood & Visual Direction

- **User cảm thấy:** Tin tưởng, an toàn, chuyên nghiệp
- **Tone:** Professional / Minimal / Tech
- **Spacing:** Balanced — 24px padding card, 16px gap giữa fields
- **Lý do:** B2B SaaS + IoT, user là Admin/Manager/Staff → cần enterprise-grade, không consumer

---

## 2. UI Style

- **Primary style:** Clean Minimalism + shadcn/ui
- **Reasoning:** Nhất quán với dashboard sau này, dễ scale, trust-building
- **Sẽ KHÔNG làm:**
  - Không gradient button
  - Không decorative background nặng
  - Không animation phức tạp
  - Không rainbow/multi-color scheme

---

## 3. Typography

| Element | Spec |
|---------|------|
| Heading | Geist 600, neutral letter-spacing |
| Body | Geist 400, `text-sm` / `text-base` |
| Scale | Fixed Tailwind sizes (không dùng fluid clamp) |

---

## 4. Color System — Thay đổi chính

**Không thêm màu mới.** Chỉ sửa 2 thứ:

| Token | Current | New | Lý do |
|-------|---------|-----|-------|
| `--radius` | `0.625rem` | `0.375rem` | Bớt bo tròn |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.205 0 0)` | Focus ring khớp primary |

Tất cả token còn lại giữ nguyên — không thêm blue, không thêm màu.

> **Contrast:** Near-black `oklch(0.205 0 0)` trên white ≈ 16:1 → đạt WCAG AAA ✅

---

## 5. Visual Hierarchy & Layout

### AuthLayout — Split Panel

| Breakpoint | Layout |
|-----------|--------|
| Mobile < 768px | Centered card, full width, `px-4` |
| Desktop ≥ 768px | Left panel (brand) + Right panel (form) — 50/50 |

**Left panel (desktop only):**
- Brand name + tagline
- Mô tả ngắn về hệ thống
- **Background:** `bg-muted` (`oklch(0.97 0 0)`) — xám nhạt, không gradient, không màu

**Scan pattern:** Single column (form area)

---

## 6. Component Inventory

| Component | Thay đổi | Lý do |
|-----------|---------|-------|
| `AuthLayout.tsx` | Split panel desktop | Brand presence |
| `LoginForm.tsx` | Thêm password show/hide toggle | UX cơ bản đang thiếu |
| `RegisterForm.tsx` | Password toggle + PasswordStrengthBar | Feedback trực quan |
| `OtpVerifyForm.tsx` | 6 ô input riêng biệt (OTP slot pattern) | UX chuẩn industry |
| `ResetOtpVerifyForm.tsx` | 6 ô input riêng biệt | Nhất quán với OtpVerifyForm |
| `ForgotPasswordPage.tsx` | Visual step indicator (3 dots) | "Bước X/3" text quá nhỏ, khó nhận biết |
| Tất cả buttons loading | Lucide `Loader2` spinner icon | Không chỉ đổi text |
| `index.css` | Fix `#root` Vite boilerplate + `--radius` + `--ring` | CSS hiện tại interfere layout |

---

## 7. Interaction & Animation

| Element | Behavior |
|---------|---------|
| Button loading | `Loader2` icon spin + disabled, `transition-all duration-150` |
| Error state | Inline message dưới field (giữ nguyên) |
| OTP input | Auto-focus next digit, paste support, backspace → focus prev |
| Password toggle | `Eye`/`EyeOff` Lucide icon, `duration-150 ease-out` |
| Card | Subtle `shadow-sm` (không competing shadows) |
| Focus ring | `ring-2 ring-primary ring-offset-2` |

---

## 8. Responsive Strategy

| Breakpoint | Behavior |
|-----------|---------|
| 375px (mobile) | Single column, full-width card, `px-4` |
| 768px (tablet) | Split panel bắt đầu hiện |
| 1024px+ (desktop) | Split 50/50, max-w-5xl tổng |
| Touch targets | ≥ 44×44px cho tất cả buttons và OTP slots |

---

## 9. Accessibility Commitments

- Contrast ≥ 4.5:1 text, ≥ 3:1 UI components
- Keyboard: OTP slots support `Tab`, `ArrowLeft`/`Right`, `Backspace`
- ARIA: `aria-label` cho password toggle button, `aria-live="polite"` cho countdown
- Reduced motion: không có animation nặng → không cần `prefers-reduced-motion` override

---

## 10. Files Sẽ Sửa

| File | Action | Nội dung thay đổi |
|------|--------|------------------|
| `src/index.css` | modify | Fix `#root` Vite boilerplate, `--radius: 0.375rem`, `--ring` near-black |
| `src/shared/components/layout/AuthLayout.tsx` | modify | Split panel desktop (left bg-muted, không gradient) |
| `src/features/auth/components/LoginForm.tsx` | modify | Password toggle (`Eye`/`EyeOff`) |
| `src/features/auth/components/RegisterForm.tsx` | modify | Password toggle + strength bar (monochrome) |
| `src/features/auth/components/OtpVerifyForm.tsx` | modify | 6-slot OTP input |
| `src/features/auth/components/ResetOtpVerifyForm.tsx` | modify | 6-slot OTP input |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | modify | Visual step indicator |

> **Không sửa:** Logic hooks, services, schemas, router, stores — chỉ UI layer.

---

## 11. OTP Slot Pattern — Spec

```
[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ]
  ↑ focus highlight: ring-2 ring-primary
```

- 6 `<input maxLength={1}>` riêng biệt, `inputMode="numeric"`, `pattern="[0-9]"`
- `onKeyDown`: Backspace → xóa + focus prev
- `onChange`: có giá trị → focus next
- `onPaste`: distribute digits across slots
- Value gộp lại → truyền vào `form.setValue('otp', combined)`

---

## 12. Password Strength Bar — Spec

```
[ Yếu    ]  ██░░░░░░░░░░  (1/4) — bg-muted-foreground/30
[ Trung  ]  ██████░░░░░░  (2/4) — bg-muted-foreground/60
[ Tốt    ]  █████████░░░  (3/4) — bg-muted-foreground/80
[ Mạnh   ]  ████████████  (4/4) — bg-foreground
```

**Monochrome only** — không dùng red/amber/green. Chỉ dùng opacity của `foreground`.

Criteria (kiểm tra realtime):
- ≥ 8 ký tự
- Có chữ hoa
- Có số
- Có ký tự đặc biệt

---

*Approved — bắt đầu implement sau khi user confirm.*
