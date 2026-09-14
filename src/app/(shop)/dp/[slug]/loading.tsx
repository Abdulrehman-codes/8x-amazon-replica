export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="grid gap-6 rounded-card bg-surface p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_18rem]">
        <div className="aspect-square animate-pulse rounded bg-canvas" />

        <div className="space-y-3">
          <div className="h-7 w-3/4 animate-pulse rounded bg-canvas" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-canvas" />
          <div className="h-9 w-32 animate-pulse rounded bg-canvas" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-3.5 w-full animate-pulse rounded bg-canvas" />
            ))}
          </div>
        </div>

        <div className="h-72 animate-pulse rounded-card bg-canvas" />
      </div>
    </div>
  );
}
