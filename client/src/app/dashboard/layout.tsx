"use client";

import { LogoutButton } from "@/components/custom/LogoutButton";
import { useRouter } from "next/navigation";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const goToHome = () => {
    router.push("/");
  };

  return (
    <section>
      {/* Include your header component here */}
      <header className="flex w-full items-center justify-between bg-white p-4">
        <h1
          onClick={goToHome}
          className="text-xl font-bold tracking-tight cursor-pointer"
        >
          Monthlify
        </h1>
        <LogoutButton />
      </header>

      <main>{children}</main>
    </section>
  );
}
