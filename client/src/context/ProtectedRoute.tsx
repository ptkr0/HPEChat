import AuthContext from "@/context/AuthProvider"
import { useContext } from "react";
import { Navigate, Outlet } from 'react-router';

export function ProtectedRoute({ allowedRoles }: {allowedRoles?: string[] }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Ładowanie…</div>;

  if (user.id === '') {
    return <Navigate to='/login' />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to='/login' />;
  }

  return <Outlet />;
}
