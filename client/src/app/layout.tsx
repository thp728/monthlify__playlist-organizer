import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <main className="min-h-screen p-5 flex">
          <div className="bg-white p-3 rounded-lg shadow-lg w-full flex-1 text-center">
            {children}
            <Toaster richColors position="top-center" />
          </div>
        </main>
      </body>
    </html>
  );
}
