import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center bg-wraptors-black">
      <h2 className="text-xl font-semibold text-white">Page not found</h2>
      <p className="text-sm text-wraptors-muted">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-wraptors-gold text-wraptors-black font-medium hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
