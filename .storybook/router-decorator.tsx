import type { Decorator } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

// Several views call useNavigate()/<Link> from TanStack Router, which throw
// outside a RouterProvider. This global decorator wraps every story in a minimal
// in-memory router so navigation resolves to clean no-ops and <Link> renders real
// anchors — more faithful than module-mocking useNavigate (which the react-vite
// builder doesn't support well).
export const RouterDecorator: Decorator = (Story) => {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <Story />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  // The story router is structurally valid for rendering; its route tree differs
  // from the app's generated tree, so the strict generic types don't line up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RouterProvider router={router as any} />;
};
