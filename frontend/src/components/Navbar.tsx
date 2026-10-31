"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, PlusCircle, Play, BarChart3, Home } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/add-card", label: "Add Card", icon: PlusCircle },
    { href: "/review", label: "Review", icon: Play },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-bone-200 bg-bone-50/90 backdrop-blur-md">
      <div className="mx-auto flex w-full lg:w-[60%] items-center justify-between px-4 py-3.5 sm:px-6">
        {/* App Logo on the Left */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-wine-plum-800 transition hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine-plum-700 text-bone-50 shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-silver-900 leading-none">
              Kumbh<span className="text-wine-plum-600">Cards</span>
            </span>
            <span className="text-[11px] font-medium text-silver-500">
              Minimal Flashcards PWA
            </span>
          </div>
        </Link>

        {/* Navbar Links Justified to the Right */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-wine-plum-700 text-bone-50 shadow-sm"
                    : "text-silver-700 hover:bg-bone-200/70 hover:text-silver-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
