"use client";

import { useCallback } from "react";

export function useAuthFetch() {
  return useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(input, { ...init, headers, credentials: "same-origin" });
    },
    []
  );
}