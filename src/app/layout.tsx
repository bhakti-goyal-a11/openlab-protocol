import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/common/navbar";
import { JudgeGuideModal } from "@/components/common/judge-guide-modal";
import { AuthProvider } from "@/context/auth-context";

export const metadata: Metadata = {
  title: "OpenLab Protocol // Trust-Governed Campus Commons",
  description: "A pure-software governance engine for institutional equipment and specialized space sharing without physical IoT sensors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased bg-grid-pattern selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <JudgeGuideModal />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

