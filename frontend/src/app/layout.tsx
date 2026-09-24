import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Terminal",
    template: "%s · AI Terminal",
  },
  description: "AI-powered terminal dashboard",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("theme-preference");
    var theme = stored === "light" || stored === "dark" ? stored : null;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is scoped to this element only (React does not
    // propagate it to children) and is the standard, documented fix for a
    // theme-init script: THEME_INIT_SCRIPT below intentionally sets
    // data-theme on <html> before hydration runs, using localStorage/OS
    // preference that the server can't know (this layout is also rendered
    // for logged-out routes like /login, /register — there is no
    // server-readable UserSettings.theme to use here; the dashboard layout
    // does pass its own server-known theme into ThemeProvider as
    // initialTheme for authenticated routes). Without this prop, React
    // would warn every time, since the attribute it hydrates against
    // (none, from the server) never matches what the script already set.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
