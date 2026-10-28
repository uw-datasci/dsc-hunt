import { Creepster, Geist, Geist_Mono } from "next/font/google";

import "@dsc-hunt/ui/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@dsc-hunt/ui/components/sonner";
import { cn } from "@dsc-hunt/ui/lib/utils";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Spooky display face for headings (h1-h3 / `font-heading`).
const fontDisplay = Creepster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontDisplay.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          {/* The site is forced dark; without this sonner follows the OS theme. */}
          <Toaster theme="dark" position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
