import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('meshbook-theme');
      return saved === 'light' ? 'light' : 'dark'; // Default to dark
    } catch {
      return 'dark';
    }
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('meshbook-theme', newTheme);
  };

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.className = theme;
    
    // Apply custom CSS variables for futuristic theme
    const colors = theme === 'dark' ? {
      '--primary': '178 100% 50%', // Cyan
      '--secondary': '240 100% 50%', // Blue  
      '--accent': '300 100% 50%', // Magenta
      '--background': '224 71% 4%', // Very dark blue
      '--surface': '224 71% 6%', // Dark blue
      '--text': '210 40% 98%', // Near white
      '--muted': '215 20% 65%', // Muted blue-gray
      '--border': '215 27% 12%', // Dark border
      '--ring': '178 100% 50%', // Cyan ring
    } : {
      '--primary': '178 100% 40%', // Darker cyan
      '--secondary': '240 100% 40%', // Darker blue
      '--accent': '300 100% 40%', // Darker magenta  
      '--background': '0 0% 100%', // White
      '--surface': '210 40% 98%', // Light gray
      '--text': '224 71% 4%', // Very dark
      '--muted': '215 20% 35%', // Muted gray
      '--border': '214 32% 91%', // Light border
      '--ring': '178 100% 40%', // Cyan ring
    };

    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme]);

  const colors = theme === 'dark' ? {
    primary: 'hsl(178, 100%, 50%)',
    secondary: 'hsl(240, 100%, 50%)',
    accent: 'hsl(300, 100%, 50%)',
    background: 'hsl(224, 71%, 4%)',
    surface: 'hsl(224, 71%, 6%)',
    text: 'hsl(210, 40%, 98%)',
    muted: 'hsl(215, 20%, 65%)'
  } : {
    primary: 'hsl(178, 100%, 40%)',
    secondary: 'hsl(240, 100%, 40%)',
    accent: 'hsl(300, 100%, 40%)',
    background: 'hsl(0, 0%, 100%)',
    surface: 'hsl(210, 40%, 98%)',
    text: 'hsl(224, 71%, 4%)',
    muted: 'hsl(215, 20%, 35%)'
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Futuristic UI Components
export const FuturisticCard = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`
      bg-surface/80 backdrop-blur-sm border border-primary/20 
      rounded-lg shadow-lg shadow-primary/10 
      hover:shadow-primary/20 hover:border-primary/40 
      transition-all duration-300 
      ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);

export const GlowButton = ({ children, className = '', variant = 'primary', ...props }: 
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'accent' }) => (
  <button 
    className={`
      px-6 py-3 rounded-lg font-medium transition-all duration-300
      ${variant === 'primary' ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:shadow-lg hover:shadow-primary/20' : ''}
      ${variant === 'secondary' ? 'bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30 hover:shadow-lg hover:shadow-secondary/20' : ''}
      ${variant === 'accent' ? 'bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 hover:shadow-lg hover:shadow-accent/20' : ''}
      ${className}
    `} 
    {...props}
  >
    {children}
  </button>
);

export const NeonText = ({ children, className = '', color = 'primary' }: 
  { children: React.ReactNode; className?: string; color?: 'primary' | 'secondary' | 'accent' }) => (
  <span 
    className={`
      font-bold bg-gradient-to-r bg-clip-text text-transparent
      ${color === 'primary' ? 'from-cyan-400 to-cyan-600' : ''}
      ${color === 'secondary' ? 'from-blue-400 to-blue-600' : ''}
      ${color === 'accent' ? 'from-purple-400 to-pink-600' : ''}
      ${className}
    `}
  >
    {children}
  </span>
);

export const AnimatedBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen">
    {/* Animated Grid Background */}
    <div className="fixed inset-0 z-0 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div 
        className="absolute inset-0 bg-grid-pattern animate-pulse"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
    
    {/* Floating Particles */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);