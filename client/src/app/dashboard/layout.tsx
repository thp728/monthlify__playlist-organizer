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
      <header className="flex w-full items-center justify-between bg-white p-4">
        <h1 className="text-xl font-bold tracking-tight">Monthlify</h1>
        <LogoutButton />
      </header>

      <main>{children}</main>
    </section>
  );
}
