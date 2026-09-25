import type { Metadata, Viewport } from "next";
import { Figtree, Google_Sans_Code } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/components/shell/theme";
import { PwaRegister } from "@/components/pwa";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });
const code = Google_Sans_Code({ variable: "--font-code", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Intervexa — Practice like it's the real interview", template: "%s · Intervexa" },
  description:
    "An AI interviewer that adapts to your answers, drills into your resume, and remembers your weak spots across sessions.",
  applicationName: "Intervexa",
  appleWebApp: { capable: true, title: "Intervexa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#131318" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang="en" data-theme={theme === "light" || theme === "dark" ? theme : undefined} suppressHydrationWarning>
      <body className={`${figtree.variable} ${code.variable} min-h-dvh antialiased`}>
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
