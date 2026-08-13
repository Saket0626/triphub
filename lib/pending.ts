export function setPending<T>(key: string, value: T) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getPending<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearPending(key: string) {
  sessionStorage.removeItem(key);
}

export const pendingKey = {
  flight: (id: string) => `triphub:pending-flight:${id}`,
  hotel: (id: string) => `triphub:pending-hotel:${id}`,
  ground: (id: string) => `triphub:pending-ground:${id}`,
  activities: (id: string) => `triphub:pending-activities:${id}`,
};
