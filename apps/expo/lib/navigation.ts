import type { Href, Router } from 'expo-router';

/**
 * Pet detail lives inside the lost-pets Stack, but callers may arrive from
 * tabs (scanner), hidden routes (map), or the list. `from` makes back deterministic.
 */
export type PetDetailOrigin = 'list' | 'map' | 'scanner';

export function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function navigatePetDetailBack(
  router: Router,
  from?: string | string[]
): void {
  const origin = normalizeParam(from) as PetDetailOrigin | undefined;

  switch (origin) {
    case 'list':
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(app)/lost-pets' as Href);
      return;
    case 'map':
      router.replace('/(app)/map' as Href);
      return;
    case 'scanner':
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(app)/scanner' as Href);
      return;
    default:
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(app)/lost-pets' as Href);
  }
}

/** Hidden tab / modal screens pushed from home quick actions. */
export function navigateScreenBack(
  router: Router,
  fallback: Href = '/(app)/home'
): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
