import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";


import Home from "@/pages/Home";
import AirQuality from "@/pages/AirQuality";
import Dashboard from "@/pages/Dashboard";
import TripPlanner from "@/pages/TripPlanner";
import Health from "@/pages/Health";
import Report from "@/pages/Report";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Settings";
import AQIMap from "@/pages/AQIMap";
import Forecast from "@/pages/Forecast";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      <Route path="/air-quality" component={AirQuality} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/map" component={AQIMap} />
      <Route path="/trip-planner" component={TripPlanner} />
      <Route path="/health" component={Health} />
      <Route path="/report" component={Report} />
      <Route path="/forecast" component={Forecast} />
      <Route path="/profile" component={Profile} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col font-body">
          <Navigation />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
