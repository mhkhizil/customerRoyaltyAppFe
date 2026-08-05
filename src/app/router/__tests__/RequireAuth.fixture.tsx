import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/core/presentation/hooks/useAuth";

/** Test mirror of AppRouter RequireAuth guard. */
export function RequireAuthFixture() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading && !user) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
