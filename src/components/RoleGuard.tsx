"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let currentRole = sessionStorage.getItem("role");

    // Auto-assign roles based on entry point if missing
    if (pathname === "/agent" || pathname.startsWith("/history") || pathname.startsWith("/admin")) {
      if (!currentRole) {
        sessionStorage.setItem("role", "agent");
        currentRole = "agent";
      } else if (currentRole === "customer") {
        router.push("/");
        return;
      }
    } else if (pathname.startsWith("/join")) {
      if (!currentRole) {
        sessionStorage.setItem("role", "customer");
        currentRole = "customer";
      }
    }

    // Sync role to cookie for Next.js API middleware protection
    if (currentRole) {
      document.cookie = `role=${currentRole}; path=/`;
    }

    setAuthorized(true);
  }, [pathname, router]);

  // Don't render protected children until authorization is checked to prevent flashing
  if (!authorized) return null;

  return <>{children}</>;
}
