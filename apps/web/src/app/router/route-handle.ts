import { useMatches } from 'react-router';

/** Per-route metadata, set through the route object's `handle`. */
export interface RouteHandle {
  title: string;
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return (
    typeof value === 'object' && value !== null && typeof (value as RouteHandle).title === 'string'
  );
}

/** Title of the deepest matched route that declares one. */
export function useRouteTitle(): string | null {
  const matches = useMatches();
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index]?.handle;
    if (isRouteHandle(handle)) {
      return handle.title;
    }
  }
  return null;
}
