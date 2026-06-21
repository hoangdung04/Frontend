import { Navigate } from "react-router-dom";
import { isAdmin } from "../utils/auth";

/**
 * ProtectedRoute – Bảo vệ các trang admin
 * Nếu không phải là admin → redirect về /admin/login
 */
function ProtectedRoute({ children }) {
  if (!isAdmin()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
