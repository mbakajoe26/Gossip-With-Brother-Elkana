import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
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
  title: "Gossip With Brother Elkana",
  description: "Join our meaningful conversations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const isAdmin = userId === process.env.ADMIN_USER_ID;
  
  // Debug logging
  console.log('Current User ID:', userId);
  console.log('Admin User ID:', process.env.ADMIN_USER_ID);
  console.log('Is Admin?', isAdmin);

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <nav className="fixed top-0 w-full p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-lg font-semibold">
                Home
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
            <UserButton afterSignOutUrl="/"/>
          </nav>
          <div className="pt-16">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
