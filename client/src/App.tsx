import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MapView from "./pages/MapView";
import SubmitSighting from "./pages/SubmitSighting";
import AdminScraper from "./pages/AdminScraper";
import NotificationSettings from "./pages/NotificationSettings";
import StatsMapView from "./pages/StatsMapView";
import About from "./pages/About";
import EmailConfirm from "./pages/EmailConfirm";
import EmailUnsubscribe from "./pages/EmailUnsubscribe";
import EmergencyGuide from "./pages/EmergencyGuide";
import EmergencyContacts from "./pages/EmergencyContacts";
import BearSafetyPopup from "./components/BearSafetyPopup";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={MapView} />
      <Route path={"/submit"} component={SubmitSighting} />
      <Route path={"/admin/scraper"} component={AdminScraper} />
      <Route path={"/notifications"} component={NotificationSettings} />
      <Route path={"/stats"} component={StatsMapView} />
      <Route path={"/about"} component={About} />
      <Route path={"/email/confirm"} component={EmailConfirm} />
      <Route path={"/email/unsubscribe"} component={EmailUnsubscribe} />
      <Route path={"/emergency-guide"} component={EmergencyGuide} />
      <Route path={"/contacts"} component={EmergencyContacts} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <BearSafetyPopup />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
