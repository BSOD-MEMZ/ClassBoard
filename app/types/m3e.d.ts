interface M3eSnackbarType {
  open(message: string, options?: Record<string, unknown>): void;
  open(message: string, action: string, options?: Record<string, unknown>): void;
  open(message: string, action: string, dismissible: boolean, options?: Record<string, unknown>): void;
  open(message: string, dismissible: boolean, options?: Record<string, unknown>): void;
  dismiss(): void;
}

declare global {
  var M3eSnackbar: M3eSnackbarType;
}

export {};
