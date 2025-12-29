import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/finance", label: "Finance" },
  { href: "/health", label: "Health" },
  { href: "/grocery", label: "Grocery" },
  { href: "/tasks", label: "Tasks" },
  { href: "/home", label: "Home Assets" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/garden", label: "Garden" },
  { href: "/hunting", label: "Hunting" },
  { href: "/life-admin", label: "Life Admin" },
  { href: "/system-health", label: "System Health" },
];

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold tracking-tight">
              Personal Command Center
            </div>
            <div className="text-xs text-muted-foreground">V1</div>
          </div>

          <nav className="hidden items-center gap-4 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-20 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Domains
            </div>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
