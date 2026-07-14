"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install app" affordance. On Android/desktop Chrome it surfaces the native
 * install prompt; on iOS Safari (no prompt API) it shows the Share → Add to
 * Home Screen hint. Hides itself once the app is installed / running standalone.
 */
export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const ua = window.navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
      setIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await deferred.prompt();
          setDeferred(null);
        }}
      >
        <Download className="mr-1.5 size-4" /> Install app
      </Button>
    );
  }

  if (iosHint) {
    return (
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Install: Share → Add to Home Screen
      </span>
    );
  }

  return null;
}
