"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, Inbox, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/", label: "Homepage", icon: Home },
  { href: "/add-card", label: "Add Cards", icon: PlusSquare },
  { href: "/review", label: "Review", icon: Inbox },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-tf-line/70 bg-tf-ink/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-tf-sky" />
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none tracking-tight text-white">
              Tempore<span className="text-tf-sky">Flashcards</span>
            </span>
            <span className="mt-1 hidden text-[11px] font-light text-tf-muted sm:block">
              Minimal Flashcards App
            </span>
          </div>
        </Link>

        <nav className="flex w-full max-w-[460px] items-stretch gap-1.5">
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
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-white transition-all ${
                  isActive
                    ? "flex-[2.2] bg-tf-accent"
                    : "flex-1 bg-tf-tile hover:bg-tf-tile-hover"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isActive && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
