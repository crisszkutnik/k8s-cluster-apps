import { Link, useLocation } from "@tanstack/react-router";
import { ROUTES } from "../routes/routes";
import { Home } from "lucide-react";
import { NewExpenseModal } from "./NewExpenseModal";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Home", to: ROUTES.HOME, icon: <Home size={18} /> },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold tracking-tight">Expenses</h1>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <NewExpenseModal />
      </div>
    </aside>
  );
}
