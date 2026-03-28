"use client";

import { useEffect, useState } from "react";

type FetchState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function useApiData<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function load() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const data = await fetchJson<T>(url, { signal: abortController.signal });
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setState({ data: null, isLoading: false, error: (error as Error).message });
      }
    }

    load();

    return () => abortController.abort();
  }, [url]);

  return state;
}
