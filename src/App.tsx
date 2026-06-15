import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import DockerDashboard from "./pages/docker/DockerDashboard";
import SwarmDashboard from "./pages/docker/SwarmDashboard";
import ContainerDetails from "./pages/docker/ContainerDetails";
import PrinterManagement from "./pages/PrinterManagement";
import Terminal from "./pages/Terminal";
import Logs from "./pages/Logs";
import Users from "./pages/Users";
import Networks from "./pages/docker/Networks";
import Images from "./pages/docker/Images";
import Storage from "./pages/Storage";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import PlaceholderPage from "./pages/PlaceholderPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="server-admin-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/docker" element={<DockerDashboard />} />
              <Route path="/swarm" element={<SwarmDashboard />} />
              <Route path="/containers/:id" element={<ContainerDetails />} />
              <Route path="/containers" element={<PlaceholderPage title="Containers" />} />
              <Route path="/images" element={<Images />} />
              <Route path="/networks" element={<Networks />} />
              <Route path="/storage" element={<Storage />} />
              <Route path="/printers" element={<PrinterManagement />} />
              <Route path="/terminal" element={<Terminal />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
