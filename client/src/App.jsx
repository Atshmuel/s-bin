import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import 'leaflet/dist/leaflet.css';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { DarkModeProvider } from './contexts/darkModelContext';
import { Toaster } from './components/ui/sonner';
import Login from '../src/pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard';
import Statistics from './pages/reports/Statistics';
import Analytics from './pages/reports/Analytics';
import BinsList from './pages/bins/BinsList';
import BinMap from './pages/bins/BinMap';
import BinDetails from './pages/bins/BinDetails';
import AllLogs from './pages/binLogs/AllLogs';
import BinLog from './pages/binLogs/BinLog';
import UserProfile from './pages/users/UserProfile';
import AccountProfile from './pages/users/AccountProfile';
import UsersList from './pages/users/UsersList';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import SupportPage from './pages/generals/SupportPage';
import ErrorPage from './pages/generals/ErrorPage';
import { MapProvider } from './contexts/mapContext';
import AddBin from './pages/bins/AddBin';
import { BreadcrumbProvider } from './contexts/breadcrumbsContext';
import AccountVerify from './pages/auth/AccountVerify';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0 } },
});

function App() {

  return <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools buttonPosition='bottom-left' initialIsOpen={false} />
    <DarkModeProvider>
      <BrowserRouter>
        <BreadcrumbProvider>
          <Routes>
            <Route
              element={
                <ProtectedRoute>
                  <MapProvider>
                    <AppLayout />
                  </MapProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate replace to="dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="analytics" element={<Analytics />} />

              <Route path='bins'>
                <Route path="" element={<BinsList />} />
                <Route path="map" element={<BinMap />} />
                <Route path="add" element={<AddBin />} />
                <Route path=":id" element={<BinDetails />} />
                <Route path='logs'>
                  <Route path="" element={<AllLogs />} />
                  <Route path=":id" element={<BinLog />} />
                </Route>
              </Route>

              <Route path='users'>
                <Route path='' element={<UsersList />} />
                <Route path=':id' element={<UserProfile />} />
              </Route>
              <Route path="account">
                <Route path="" element={<AccountProfile />} />
              </Route>
              {/* Role protected routes */}
              <Route path="management">
                <Route path="bins" element={<BinsList />} />
                <Route path="users" element={<UsersList />} />
              </Route>
              {/* end of role protected routes */}


            </Route>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="/user">
              <Route path="verify" element={<AccountVerify />} />
            </Route>
            <Route path="support" element={<SupportPage />} />

            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </BreadcrumbProvider>
      </BrowserRouter>
    </DarkModeProvider>
    <Toaster richColors duration={3000} position="top-right" />
  </QueryClientProvider >

}

export default App
