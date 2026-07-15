"use client";

import { useRouter } from "next/navigation";

import { PackingList } from "@/components/trip/packing-list";

export default function PackingPage() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push("/");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PackingList onBack={goBack} />
    </div>
  );
}
