import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";
import "./globals.css";

// Poppins is not a variable font, so each weight the site uses is listed.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N34 Mirissa | Luxury Resort",
  description: "Experience the magic of Mirissa at N34 Resort.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The chosen theme is kept in a cookie (see ThemeToggle) so the server can send the page already
  // in dark mode: no white flash, and no inline script needed. Light is the default.
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : undefined;

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Suspense: the bar reads the address, which must not hold up the rest of the page. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
