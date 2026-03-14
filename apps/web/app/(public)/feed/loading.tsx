export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 bg-[rgba(0,229,255,.08)] rounded" />
        <div className="h-4 w-72 bg-[rgba(0,229,255,.05)] rounded" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="contrib-card animate-pulse" style={{ gridTemplateColumns: "1fr" }}>
            <div className="h-4 w-24 bg-[rgba(0,229,255,.08)] rounded" />
            <div className="h-5 w-64 bg-[rgba(0,229,255,.08)] rounded" />
            <div className="h-3 w-40 bg-[rgba(0,229,255,.05)] rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
