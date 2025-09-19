"use client";

import { Footer } from "@/components/custom/Footer";
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
    <section className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex w-full items-center justify-between bg-white p-4">
        <h1
          onClick={goToHome}
          className="text-xl font-bold tracking-tight cursor-pointer"
        >
          Monthlify
        </h1>
        <LogoutButton />
      </header>

      {/* Main fills remaining height */}
      <main className="flex flex-col items-center justify-around flex-1">
        {children}
        <Footer />
      </main>
    </section>
  );
}
