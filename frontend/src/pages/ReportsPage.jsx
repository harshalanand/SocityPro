// Redirects to new reports overview
import { Navigate } from 'react-router-dom';
export default function ReportsPage() {
  return <Navigate to="/reports" replace />;
}
