import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <Icon name="home" /> },
  { to: "/admin/bidders", label: "Bidders", icon: <Icon name="users" /> },
  { to: "/admin/profiles", label: "Profiles", icon: <Icon name="user-square" /> },
  { to: "/admin/templates", label: "Templates", icon: <Icon name="template" /> },
  { to: "/admin/work-logs", label: "Work logs", icon: <Icon name="activity" /> },
];

const bidderNav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: <Icon name="home" /> },
  { to: "/app/profiles", label: "My Profiles", icon: <Icon name="user-square" /> },
  { to: "/app/folders", label: "Folders", icon: <Icon name="file" /> },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const items = user?.role === "ADMIN" ? adminNav : bidderNav;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
            <Icon name="sparkles" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Resume Tailor</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              {user?.role === "ADMIN" ? "Admin" : "Bidder"}
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin" || item.to === "/app"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )
              }
            >
              <span className="text-slate-500">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

function Icon({ name }: { name: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="m3 12 9-9 9 9v8a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-8z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "user-square":
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 21v-2a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" />
        </svg>
      );
    case "template":
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case "activity":
      return (
        <svg {...props}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...props}>
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
        </svg>
      );
    default:
      return null;
  }
}
