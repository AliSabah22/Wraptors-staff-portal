import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RootErrorBoundary } from "@/components/error-boundary";
import { ChunkLoadErrorHandler } from "@/components/chunk-load-error-handler";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wraptors Staff Portal",
  description: "Backend operating system for Wraptors wrap shop",
};

/**
 * Keep layout minimal: only global providers, fonts, metadata.
 * No dynamic() imports, no heavy logic, no server-only modules in children.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var key = 'wraptors-chunk-reload', timeKey = 'wraptors-chunk-reload-time';
  function isChunk(e) {
    var m = (e && (e.message || (e.reason && e.reason.message))) || '';
    return (e && e.name === 'ChunkLoadError') || /ChunkLoadError|loadChunk|Loading chunk/i.test(m);
  }
  function reload() {
    try {
      var last = sessionStorage.getItem(timeKey), now = Date.now();
      if (last && now - parseInt(last, 10) < 8000) return;
      sessionStorage.setItem(timeKey, String(now)); sessionStorage.setItem(key, '1');
    } catch (_) {}
    location.reload();
  }
  window.addEventListener('error', function(ev) { if (isChunk(ev.error)) { ev.preventDefault(); reload(); } });
  window.addEventListener('unhandledrejection', function(ev) { if (isChunk(ev.reason)) { ev.preventDefault(); reload(); } });
  setTimeout(function() { try { sessionStorage.removeItem(key); sessionStorage.removeItem(timeKey); } catch(_) {} }, 5000);
})();
            `.trim(),
          }}
        />
        <ChunkLoadErrorHandler />
        <RootErrorBoundary>
          <AuthLayout>{children}</AuthLayout>
        </RootErrorBoundary>
      </body>
    </html>
  );
}
