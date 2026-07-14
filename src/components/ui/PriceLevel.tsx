export function PriceLevel({ level }: { level?: 1 | 2 | 3 | 4 }) {
  if (!level) return null;
  return (
    <span className="inline-flex text-sm font-medium tracking-tight" aria-label={`price level ${level} of 4`}>
      <span className="text-zinc-800 dark:text-zinc-200">{'€'.repeat(level)}</span>
      <span className="text-zinc-300 dark:text-zinc-600">{'€'.repeat(4 - level)}</span>
    </span>
  );
}
