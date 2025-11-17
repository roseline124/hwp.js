export const pxFrom100thMm = (v: number): number => Math.round(v / 26.458);

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const el = window.document.createElement(tag);
  if (className) el.className = className;
  return el;
}
