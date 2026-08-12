interface Props {
  /** Names of the people currently typing. */
  names: string[];
}

/**
 * Text-based "typing" indicator, transparent background, placed right above the input.
 * 1 person → "[Name] is typing"; multiple → "N people are typing". Includes 3 small
 * pulsing dots (dot-pulse keyframe).
 */
export default function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.length} people are typing`;

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
