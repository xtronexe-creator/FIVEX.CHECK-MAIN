import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ScanCodes from "./pages/ScanCodes";
import ScanResults from "./pages/ScanResults";
import LiveLogs from "./pages/LiveLogs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "./const";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    // Not logged in: send to backend /login page
    window.location.href = getLoginUrl();
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/codes"} component={() => <ProtectedRoute component={ScanCodes} />} />
      <Route path={"/results"} component={() => <ProtectedRoute component={ScanResults} />} />
      <Route path={"/logs"} component={() => <ProtectedRoute component={LiveLogs} />} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              style: { background: '#1a1a1a', border: '1px solid #8b5cf6' },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;