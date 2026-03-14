import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center gap-6 p-6">
      <div className="text-4xl font-bold">DevDAO</div>
      <p className="text-lg text-slate-600 max-w-xl">
        Decentralized Community Growth & Contribution Approval Platform.
      </p>
      <div className="flex gap-4">
        <Link className="px-4 py-2 rounded bg-indigo-600 text-white" href="/feed">
          View Feed
        </Link>
        <Link className="px-4 py-2 rounded border border-indigo-200" href="/submit">
          Submit Contribution
        </Link>
      </div>
    </main>
  );
}
