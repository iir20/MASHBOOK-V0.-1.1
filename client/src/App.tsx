import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnhancedMainAppV2 } from "./components/enhanced-main-app-v2";
import { MinimalMainApp } from "./components/minimal-main-app";
import { DebugTest } from "./components/debug-test";

function App() {
  console.log('App: Starting Meshbook application');

  // Check for debug mode
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';
  const isMinimalMode = urlParams.get('minimal') === 'true';
  
  if (isDebugMode) {
    return <DebugTest />;
  }
  
  if (isMinimalMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MinimalMainApp />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  try {
    console.log('App: Attempting to render main components');
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '20px' }}>
            <h1>Meshbook Loading...</h1>
            <EnhancedMainAppV2 />
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App rendering error:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: '#ff0000' }}>Application Error</h1>
        <p>There was an error loading the application:</p>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <p>
          <a href="?debug=true" style={{ color: '#007bff' }}>
            Switch to Debug Mode
          </a>
        </p>
      </div>
    );
  }
}

export default App;
