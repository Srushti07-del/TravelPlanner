import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Plane } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adaptive AI Travel Planner",
  description: "Your trip shouldn't follow a plan. Your plan should follow your trip.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-xl text-slate-900 tracking-tight">TravelPlanner</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/trips" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  My Trips
                </Link>
                <Link href="/auth" className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl text-white">TravelPlanner</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                The world's first truly adaptive AI travel planner. Your trip shouldn't follow a plan. Your plan should follow your trip.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/plan" className="hover:text-primary transition-colors">Plan a Trip</Link></li>
                <li><Link href="/trips" className="hover:text-primary transition-colors">My Trips</Link></li>
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
            &copy; {new Date().getFullYear()} TravelPlanner. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
