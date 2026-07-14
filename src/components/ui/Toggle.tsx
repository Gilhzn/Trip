export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
        checked ? 'justify-end bg-primary-600' : 'justify-start bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span className="size-5 rounded-full bg-white shadow" />
    </button>
  );
}
