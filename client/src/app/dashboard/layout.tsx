import { LogoutButton } from "@/components/custom/LogoutButton";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Include your header component here */}
      <header className="bg-gray-50 px-5 py-1 flex justify-between">
        <h1 className="text-xl">Monthlify</h1>
        <LogoutButton />
      </header>

      <main>{children}</main>
    </section>
  );
}
