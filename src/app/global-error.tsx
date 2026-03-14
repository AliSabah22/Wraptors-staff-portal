"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold">Application error</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-md text-center">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 px-4 py-2 rounded-lg bg-[#C8A45D] text-black font-medium hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
