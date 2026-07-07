interface Props {
  /** Tên những người đang nhập. */
  names: string[];
}

/**
 * Chỉ báo "đang nhập" dạng chữ, nền trong suốt, đặt ngay trên ô nhập. 1 người → "[Tên] đang
 * nhập"; nhiều người → "N người đang nhập". Kèm 3 chấm nhấp nháy nhỏ (keyframe dot-pulse).
 */
export default function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} đang nhập`
      : `${names.length} người đang nhập`;

  return (
    <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] text-muted-foreground italic leading-none">
      <span className="truncate">{label}</span>
      <span className="flex items-center gap-0.75">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot size-1 rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
    </div>
  );
}
