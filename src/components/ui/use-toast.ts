"use client";

import * as React from "react";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastItem = ToastOptions & { id: string };

let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l(toasts));
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36);

  toasts = [{ id, ...options }];
  notify();

  setTimeout(() => {
    toasts = [];
    notify();
  }, 4000);
}

export function useToast() {
  const [state, setState] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return { toasts: state };
}
