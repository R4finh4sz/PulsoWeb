import { Suspense, type ReactNode } from "react";

const parameters = new Map<string, Promise<object>>();

export function routeParams<T extends object>(value: T): Promise<T> {
  const key = JSON.stringify(value);
  if (!parameters.has(key)) parameters.set(key, Object.assign(Promise.resolve(value), { status: "fulfilled", value }));
  return parameters.get(key) as Promise<T>;
}

// Route promises stay stable while React suspends, as they do in Next.js.
export function routeFixture<P>(render: (props: P) => ReactNode) {
  return function RouteFixture(props: P) {
    return <Suspense fallback={null}>{render(props)}</Suspense>;
  };
}
