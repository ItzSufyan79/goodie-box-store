"use client";

import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    (ToastProps & { id: number })[]
  >([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-white border shadow-lg rounded-lg p-4 max-w-sm"
          >
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            {t.description && (
              <p className="text-sm text-muted-foreground">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
