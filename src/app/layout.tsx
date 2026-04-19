import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SME Yacht Sales",
  description: "小微企业游艇售卖网站 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="flex min-h-full flex-col">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
