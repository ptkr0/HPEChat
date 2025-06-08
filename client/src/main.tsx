import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import UserPage from './pages/UserPage.tsx'
import { ProtectedRoute } from './context/ProtectedRoute.tsx'
import ProtectedLayout from './pages/ProtectedPage.tsx'
import ServerLayout from './pages/ServerLayout.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="motyw">
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors/>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/home" element={<UserPage />} />
                <Route path="/servers/:serverId/:channelId?" element={<ServerLayout />} />
              </Route>
            </Route>
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>,
)
