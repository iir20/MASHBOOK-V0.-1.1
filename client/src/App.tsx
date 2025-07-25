import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OptimizedMainApp } from "./components/optimized-main-app";
import { DebugApp } from "./components/debug-app";
import { SimpleTestApp } from "./components/simple-test-app";

function App() {
  // Check if we should use the simple test app
  const urlParams = new URLSearchParams(window.location.search);
  const useSimpleApp = urlParams.get('simple') === 'true';

  console.log('App: Starting with useSimpleApp:', useSimpleApp);

  try {
    if (useSimpleApp) {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <SimpleTestApp />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <OptimizedMainApp />
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
