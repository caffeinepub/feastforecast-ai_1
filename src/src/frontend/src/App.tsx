import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { EventInputPage } from "@/pages/EventInputPage";
import { MenuApprovalPage } from "@/pages/MenuApprovalPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { KitchenPage } from "@/pages/KitchenPage";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen">
        <Toaster />
        <Outlet />
      </div>
    </ThemeProvider>
  ),
});

// Route definitions
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: EventInputPage,
});

const menuApprovalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu-approval/$eventId",
  component: MenuApprovalPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/$eventId",
  component: DashboardPage,
});

const kitchenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kitchen/$eventId",
  component: KitchenPage,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  menuApprovalRoute,
  dashboardRoute,
  kitchenRoute,
]);

// Create router instance
const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
