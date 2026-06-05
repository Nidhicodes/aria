export function Panel({
  title,
  accent,
  right,
  className = "",
  children,
}: {
  title?: string;
  accent?: "ice" | "amber" | "neutral";
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const tint =
    accent === "ice"
      ? "border-ice/15"
      : accent === "amber"
        ? "border-amber/15"
        : "border-hair";
  return (
    <section className={`border ${tint} bg-canvas/70 ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-hair/70 px-4 py-2.5">
          <h2 className="label-caps font-mono text-[9.5px] text-ink-lo">
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
