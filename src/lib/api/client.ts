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
    let message = `Request failed with ${response.status}`;

    try {
      const payload = (await response.clone().json()) as { error?: string; message?: string };
      if (payload?.error || payload?.message) {
        message = payload.error || payload.message || message;
      } else {
        const text = await response.text();
        if (text) {
          message = text;
        }
      }
    } catch {
      const text = await response.text().catch(() => "");
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
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
