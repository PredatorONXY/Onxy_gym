"use client";

import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="pt-16 flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
