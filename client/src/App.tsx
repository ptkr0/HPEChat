import './App.css'
import { ThemeProvider } from './components/theme-provider'
import { LoginForm } from './components/login-form'
import { ModeToggle } from './components/mode-toggle';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors/>
        <div className="fixed right-4 top-4 z-50">
          <ModeToggle />
        </div>

        <div className="flex h-auto w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
    </ThemeProvider>
  );
}

export default App
