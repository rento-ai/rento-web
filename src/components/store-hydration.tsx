"use client";

import { useEffect } from "react";
import usePgStore from "@/store/usePg.store";
import useUserStore from "@/store/useUser.store";

function hydrateStore(
  persistApi:
    | {
        hasHydrated: () => boolean;
        onFinishHydration: (cb: () => void) => () => void;
      }
    | undefined,
  setHydrated: () => void,
) {
  if (!persistApi || persistApi.hasHydrated()) {
    setHydrated();
    return;
  }
  return persistApi.onFinishHydration(() => {
    setHydrated();
  });
}

export function StoreHydration() {
  useEffect(() => {
    const unsubPg = hydrateStore(
      usePgStore.persist,
      usePgStore.getState().setHydrated,
    );
    const unsubUser = hydrateStore(
      useUserStore.persist,
      useUserStore.getState().setHydrated,
    );
    return () => {
      unsubPg?.();
      unsubUser?.();
    };
  }, []);

  return null;
}
