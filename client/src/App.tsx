import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "./providers/theme-provider";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CourseDetailsPage from "@/pages/course-details-page";
import SettingsPage from "@/pages/settings-page";
import CoursesPage from "@/pages/courses-page";
import MyCoursesPage from "@/pages/my-courses-page";
import CertificatesPage from "@/pages/certificates-page";
import ProfilePage from "@/pages/profile-page";
import AboutPage from "@/pages/about-page";
import AdminCoursesPage from "@/pages/admin-courses-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminApiConfigPage from "@/pages/admin-api-config-page";

// Custom component to check if user is admin
function AdminProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // While checking auth status, show nothing
  if (isLoading) {
    return null;
  }

  // If user isn't admin, redirect to dashboard
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  // If user is admin, render the protected component
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/courses" component={CoursesPage} />
      <ProtectedRoute path="/my-courses" component={MyCoursesPage} />
      <ProtectedRoute path="/certificates" component={CertificatesPage} />
      <ProtectedRoute path="/course/:id" component={CourseDetailsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/about" component={AboutPage} />
      
      {/* Admin routes */}
      <AdminProtectedRoute path="/admin/courses" component={AdminCoursesPage} />
      <AdminProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <AdminProtectedRoute path="/admin/api-config" component={AdminApiConfigPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="lms-theme-preference">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
