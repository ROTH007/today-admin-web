import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        You don't have permission to view this page.
      </div>
    );
  }

  return children;
}
