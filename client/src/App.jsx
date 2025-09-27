import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { ViewProvider } from './contexts/toggleDarkMode';
import { Toaster } from './components/ui/sonner';
import Login from '../src/pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard';
import Statistics from './pages/reports/Statistics';
import Analytics from './pages/reports/Analytics';
import AppSettings from './pages/settings/AppSettings';
import BinsList from './pages/bins/BinList';
import BinMap from './pages/bins/BinMap';
import BinDetails from './pages/bins/BinDetails';
import AllLogs from './pages/binLogs/AllLogs';
import BinLogs from './pages/binLogs/BinLogs';
import LogDetails from './pages/binLogs/LogDetails';
import UserProfile from './pages/users/UserProfile';
import UsersList from './pages/users/owner/UsersList';
import UserManagement from './pages/users/owner/UserManagement';
import CreateBin from './pages/bins/CreateBin';
import CreateUser from './pages/users/owner/CreateUser';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import SupportPage from './pages/generals/SupportPage';
import ErrorPage from './pages/generals/ErrorPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0 } },
});

function App() {

  return <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <ViewProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<AppSettings />} />

            <Route path='bins'>
              <Route path="" element={<BinsList />} />
              <Route path="map" element={<BinMap />} />
              <Route path=":id" element={<BinDetails />} />
              <Route path='logs'>
                <Route path="" element={<AllLogs />} />
                <Route path=":id" element={<LogDetails />} />
                <Route path="bin/:id" element={<BinLogs />} />
              </Route>

            </Route>
            <Route path="account">
              <Route path="" element={<UserProfile />} />
            </Route>

            <Route path="owner">
              <Route path="new">
                <Route path="bin" element={<CreateBin />} />
                <Route path="user" element={<CreateUser />} />
              </Route>
              <Route path="users">
                <Route path="" element={<UsersList />} />
                <Route path=":id" element={<UserManagement />} />
              </Route>
            </Route>

          </Route>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="support" element={<SupportPage />} />

          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </ViewProvider>
    <Toaster richColors duration={3000} position="bottom-center" />
  </QueryClientProvider >

}

export default App
