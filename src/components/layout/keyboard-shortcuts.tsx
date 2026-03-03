"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/hooks/use-ui-store";

export function KeyboardShortcuts() {
  const router = useRouter();
  const { openNewIssueModal, openNewProjectModal } = useUIStore();
  const lastKey = useRef<string | null>(null);
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();
      
      // Handle sequences (e.g., G then I)
      if (lastKey.current === "g" && now - lastKeyTime.current < 500) {
        e.preventDefault();
        lastKey.current = null; // reset
        
        switch (key) {
          case "d": router.push("/"); break;
          case "i": router.push("/issues"); break;
          case "b": router.push("/board"); break;
          case "p": router.push("/projects"); break;
          case "s": router.push("/settings"); break;
          case "m": router.push("/my-issues"); break;
        }
        return;
      }

      // Single key shortcuts
      switch (key) {
        case "c":
          e.preventDefault();
          openNewIssueModal();
          break;
        case "p":
          // Only if not part of a sequence
          if (lastKey.current !== "g") {
            e.preventDefault();
            openNewProjectModal();
          }
          break;
        case "g":
          lastKey.current = "g";
          lastKeyTime.current = now;
          break;
        default:
          lastKey.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, openNewIssueModal, openNewProjectModal]);

  return null;
}
