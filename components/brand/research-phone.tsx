/** Product mock for the research spotlight — our UI, not a stock phone photo. */
export function ResearchPhone() {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.4rem] border border-black/[0.08] bg-[#111827] p-3 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.55)]">
        <div className="overflow-hidden rounded-[1.85rem] bg-white">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-channel">
              Live research
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-channel" />
          </div>
          <div className="px-5 pb-5">
            <p className="font-serif text-[1.65rem] leading-tight text-soundings">Lisbon, Friday</p>
            <p className="mt-1 text-sm text-pencil">Two nights. You asked for walkable.</p>
          </div>
          <div className="mx-4 mb-4 rounded-2xl border border-channel/20 bg-accent p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-channel">
              Live insight
            </p>
            <p className="mt-2 text-sm leading-snug text-soundings">
              Santo António week is on. Alfama stays fill first.
            </p>
            <p className="mt-2 text-xs text-pencil">According to Time Out Lisbon</p>
          </div>
          <div className="mx-4 mb-5 rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold text-soundings">Casa da Sé</p>
            <p className="mt-1 text-sm text-pencil">$186 / night · 8 min walk</p>
            <p className="mt-2 text-xs text-channel">Recommended for your dates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
