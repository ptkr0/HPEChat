import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { ModeToggle } from './components/mode-toggle.tsx'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import UserPage from './pages/UserPage.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors/>
          <div className="absolute right-4 top-4 z-9999">
            <ModeToggle />
          </div>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<UserPage />} />
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>,
)
