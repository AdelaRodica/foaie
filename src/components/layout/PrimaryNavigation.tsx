"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./PrimaryNavigation.module.css";

type NavigationVariant = "desktop" | "mobile";
type IconName = "home" | "library" | "add" | "album" | "chart" | "settings" | "more";

type NavigationItem = Readonly<{
  href: string;
  label: string;
  icon: IconName;
  activePaths?: readonly string[];
  match?: "exact" | "section";
  kind?: "standard" | "action" | "end";
}>;

const desktopItems: readonly NavigationItem[] = [
  { href: "/", label: "Inicio", icon: "home", match: "exact" },
  { href: "/biblioteca", label: "Biblioteca", icon: "library", match: "section" },
  { href: "/mi-album", label: "Mi álbum", icon: "album", match: "section" },
  { href: "/estadisticas", label: "Estadísticas", icon: "chart", match: "section" },
  { href: "/biblioteca/nuevo", label: "Añadir libro", icon: "add", match: "exact", kind: "action" },
  { href: "/ajustes", label: "Ajustes", icon: "settings", match: "section", kind: "end" },
];

const mobileItems: readonly NavigationItem[] = [
  { href: "/", label: "Inicio", icon: "home", match: "exact" },
  { href: "/biblioteca", label: "Biblioteca", icon: "library", match: "exact" },
  { href: "/biblioteca/nuevo", label: "Añadir", icon: "add", match: "exact", kind: "action" },
  { href: "/mi-album", label: "Mi álbum", icon: "album", match: "section" },
  {
    href: "/mas",
    label: "Más",
    icon: "more",
    activePaths: ["/estadisticas", "/ajustes"],
    match: "section",
  },
];

function NavigationIcon({ name }: Readonly<{ name: IconName }>) {
  const commonProps = {
    "aria-hidden": true,
    className: styles.icon,
    focusable: false,
    viewBox: "0 0 24 24",
  } as const;

  switch (name) {
    case "home":
      return <svg {...commonProps}><path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8Z" /></svg>;
    case "library":
      return <svg {...commonProps}><path d="M4 4.5h4v15H4zm6 0h4v15h-4zm6.5 1 3.5-1 3.5 14-3.5 1z" /></svg>;
    case "add":
      return <svg {...commonProps}><path d="M12 5v14M5 12h14" /></svg>;
    case "album":
      return <svg {...commonProps}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" /></svg>;
    case "chart":
      return <svg {...commonProps}><path d="M5 20V10m7 10V4m7 16v-7" /></svg>;
    case "settings":
      return <svg {...commonProps}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3m0 13v3m9.5-9.5h-3m-13 0h-3m16.2-6.2-2.1 2.1M7.4 16.6l-2.1 2.1m13.4 0-2.1-2.1M7.4 7.4 5.3 5.3" /></svg>;
    case "more":
      return <svg {...commonProps}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
  }
}

function itemIsActive(pathname: string, item: NavigationItem) {
  if (item.href === "/biblioteca" && pathname === "/biblioteca/nuevo") {
    return false;
  }

  if (item.activePaths?.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }

  return item.match === "section"
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

export function PrimaryNavigation({ variant }: Readonly<{ variant: NavigationVariant }>) {
  const pathname = usePathname();
  const items = variant === "desktop" ? desktopItems : mobileItems;

  return (
    <nav
      className={`${styles.navigation} ${styles[variant]}`}
      aria-label={variant === "desktop" ? "Navegación principal" : "Navegación móvil"}
    >
      {items.map((item) => {
        const active = itemIsActive(pathname, item);
        const classNames = [styles.link];

        if (active) classNames.push(styles.active);
        if (item.kind === "action") classNames.push(styles.action);
        if (item.kind === "end") classNames.push(styles.end);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={classNames.join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
