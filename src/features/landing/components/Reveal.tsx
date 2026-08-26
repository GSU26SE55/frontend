import { useEffect, useRef, type ReactNode } from "react";
import { animate, onScroll, type AnimationParams } from "animejs";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, EASE } from "@/features/landing/lib/animation";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  translateX?: number;
  translateY?: number;
  duration?: number;
  ease?: string;
};

const Reveal = ({
  children,
  className,
  delay = 0,
  translateX = 0,
  translateY = 28,
  duration = 700,
  ease = EASE.out,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.style.opacity = "1";
      return;
    }

    // Khai đúng kiểu của animejs thay vì Record<string, unknown>: `unknown` không gán được
    // vào union giá trị của AnimationParams, nên bản cũ chỉ biên dịch được ở `tsc --noEmit`
    // với cấu hình gốc và vỡ khi chạy `tsc -b` lúc build.
    const props: AnimationParams = {
      opacity: [0, 1],
      duration,
      delay,
      ease,
      autoplay: onScroll({ target: node, repeat: false }),
    };

    if (translateY !== 0) props.translateY = [translateY, 0];
    if (translateX !== 0) props.translateX = [translateX, 0];

    const anim = animate(node, props);

    return () => {
      anim.revert();
    };
  }, [delay, translateX, translateY, duration, ease]);

  return (
    <div ref={ref} className={cn("min-w-0", className)} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

export default Reveal;
