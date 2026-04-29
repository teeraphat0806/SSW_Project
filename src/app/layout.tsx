import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { getServerSession } from "next-auth/next";
import SessionProvider from "../components/SessionProvider";
import { ThemeProvider } from "@/components/saleDashboard/theme-provider";
import { authOptions } from "@/lib/auth";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SSW Steel Center",
  description: "SSW Steel Center - Steel Management System",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
          disableTransitionOnChange
        >
          <Theme>
            <SessionProvider session={session}>{children}</SessionProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
