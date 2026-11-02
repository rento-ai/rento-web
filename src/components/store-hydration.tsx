"use client";

import { useEffect } from "react";
import usePgStore from "@/store/usePg.store";

export function StoreHydration() {
  useEffect(() => {
    const api = usePgStore.persist;
    if (!api || api.hasHydrated()) {
      usePgStore.getState().setHydrated();
      return;
    }
    return api.onFinishHydration(() => {
      usePgStore.getState().setHydrated();
    });
  }, []);

  return null;
}
