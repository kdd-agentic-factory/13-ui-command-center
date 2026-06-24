export function goTo(path: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}
