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
        <ChunkLoadErrorHandler />
        <RootErrorBoundary>
          <AuthLayout>{children}</AuthLayout>
        </RootErrorBoundary>
      </body>
    </html>
  );
}
