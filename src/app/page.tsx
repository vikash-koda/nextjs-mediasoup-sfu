"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = sessionStorage.getItem("role");
    if (role === "customer") {
      // Stay on page to prevent infinite loop, or show message
    } else {
      router.push("/agent");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground flex-col gap-4">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
        AtomQuest Customer Portal
      </h1>
      <p className="text-gray-400">
        You are currently recognized as a Customer on this device.
        <br/>
        Please use the invite link provided by your Agent to join a call.
      </p>
      <button 
        onClick={() => {
          sessionStorage.clear();
          document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/agent");
        }}
        className="mt-4 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 transition text-sm"
      >
        Switch to Agent View
      </button>
    </div>
  );
}
