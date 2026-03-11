"use client";

import { useEffect, useState } from "react";
import { NetworkDetector } from "@/lib/offline/NetworkDetector";

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState<boolean>(NetworkDetector.isOnline());

  useEffect(() => {
    const unsubscribe = NetworkDetector.subscribe(setOnline);
    return unsubscribe;
  }, []);

  return online;
}
