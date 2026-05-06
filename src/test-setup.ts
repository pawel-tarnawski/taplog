import "@testing-library/jest-dom";

// jsdom does not implement ResizeObserver — provide a no-op stub
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
