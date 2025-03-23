import { Switch, Route } from "wouter";
import { Suspense, lazy, useEffect, useState } from "react";
import { isAuthenticated, isAdmin, isStudent, getCurrentUser } from "@/lib/auth";
import NotFound from "@/pages/not-found";

// Auth Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Lazy loaded pages
const StudentDashboard = lazy(() => import("@/pages/student/dashboard"));
const StudentTracking = lazy(() => import("@/pages/student/tracking"));
const StudentSchedule = lazy(() => import("@/pages/student/schedule"));
const StudentPayments = lazy(() => import("@/pages/student/payments"));
const StudentRoutes = lazy(() => import("@/pages/student/routes"));
const StudentProfile = lazy(() => import("@/pages/student/profile"));
const StudentCheckout = lazy(() => import("@/pages/student/checkout"));

const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminBuses = lazy(() => import("@/pages/admin/buses"));
const AdminDrivers = lazy(() => import("@/pages/admin/drivers"));
const AdminStudents = lazy(() => import("@/pages/admin/students"));
const AdminRoutes = lazy(() => import("@/pages/admin/routes"));
const AdminPayments = lazy(() => import("@/pages/admin/payments"));

function ProtectedRoute({ 
  component: Component,
  requiredRole,
}: { 
  component: React.ComponentType; 
  requiredRole?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      let hasRequiredRole = true;
      
      if (requiredRole === 'admin') {
        hasRequiredRole = isAdmin();
      } else if (requiredRole === 'student') {
        hasRequiredRole = isStudent();
      }
      
      setAuthorized(isAuth && hasRequiredRole);
      setLoading(false);
    };
    
    checkAuth();
  }, [requiredRole]);
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return authorized ? <Component /> : <Login />;
}

function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Student routes */}
        <Route path="/student">
          <ProtectedRoute component={StudentDashboard} requiredRole="student" />
        </Route>
        <Route path="/student/dashboard">
          <ProtectedRoute component={StudentDashboard} requiredRole="student" />
        </Route>
        <Route path="/student/tracking">
          <ProtectedRoute component={StudentTracking} requiredRole="student" />
        </Route>
        <Route path="/student/schedule">
          <ProtectedRoute component={StudentSchedule} requiredRole="student" />
        </Route>
        <Route path="/student/payments">
          <ProtectedRoute component={StudentPayments} requiredRole="student" />
        </Route>
        <Route path="/student/routes">
          <ProtectedRoute component={StudentRoutes} requiredRole="student" />
        </Route>
        <Route path="/student/profile">
          <ProtectedRoute component={StudentProfile} requiredRole="student" />
        </Route>
        <Route path="/student/checkout">
          <ProtectedRoute component={StudentCheckout} requiredRole="student" />
        </Route>

        {/* Admin routes */}
        <Route path="/admin">
          <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
        </Route>
        <Route path="/admin/dashboard">
          <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
        </Route>
        <Route path="/admin/buses">
          <ProtectedRoute component={AdminBuses} requiredRole="admin" />
        </Route>
        <Route path="/admin/drivers">
          <ProtectedRoute component={AdminDrivers} requiredRole="admin" />
        </Route>
        <Route path="/admin/students">
          <ProtectedRoute component={AdminStudents} requiredRole="admin" />
        </Route>
        <Route path="/admin/routes">
          <ProtectedRoute component={AdminRoutes} requiredRole="admin" />
        </Route>
        <Route path="/admin/payments">
          <ProtectedRoute component={AdminPayments} requiredRole="admin" />
        </Route>

        {/* Redirect to appropriate dashboard based on role */}
        <Route path="/dashboard">
          {() => {
            if (userRole === 'admin') {
              return <ProtectedRoute component={AdminDashboard} requiredRole="admin" />;
            } else if (userRole === 'student') {
              return <ProtectedRoute component={StudentDashboard} requiredRole="student" />;
            } else {
              return <Login />;
            }
          }}
        </Route>

        {/* Fallback - 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default App;
