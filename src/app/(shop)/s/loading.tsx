export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="mb-3 h-12 animate-pulse rounded-card bg-surface" />
      <div className="flex gap-5">
        <div className="hidden w-56 shrink-0 space-y-6 lg:block">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-surface" />
              {Array.from({ length: 4 }, (_, j) => (
                <div
                  key={j}
                  className="h-3.5 w-full animate-pulse rounded bg-surface"
                />
              ))}
            </div>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-card border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
