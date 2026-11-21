/**
 * Route chunks, shared by the router (React.lazy) and prefetching: links prefetch on hover / focus /
 * touch, and once the app is idle the main screens are fetched in the background, so switching tabs
 * never waits for the network.
 */
export const routeLoaders = {
  home: () => import('../features/home/HomeScreen'),
  food: () => import('../features/food/FoodScreen'),
  health: () => import('../features/health/HealthScreen'),
  workouts: () => import('../features/workouts/WorkoutsScreen'),
  planner: () => import('../features/planner/PlannerScreen'),
  store: () => import('../features/store/StoreScreen'),
  settings: () => import('../features/settings/SettingsScreen'),
  plans: () => import('../features/plans/PlansScreen'),
  stories: () => import('../features/testimonials/TestimonialsScreen'),
} as const;
export type RouteKey = keyof typeof routeLoaders;

const started = new Set<RouteKey>();
export function prefetchRoute(key: RouteKey) {
  if (started.has(key)) return;
  started.add(key);
  void routeLoaders[key]().catch(() => started.delete(key));
}

/** Background prefetch of the likely next screens when the main thread is idle (skipped on Save-Data). */
export function prefetchWhenIdle(keys: RouteKey[] = ['food', 'health', 'workouts', 'planner', 'plans', 'settings', 'store']) {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;
  const idle = (cb: () => void) => ((window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(cb);
  keys.forEach((k, i) => idle(() => setTimeout(() => prefetchRoute(k), i * 150)));
}
