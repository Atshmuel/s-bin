import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { ViewProvider } from './contexts/toggleDarkMood';
import { Toaster } from './components/ui/sonner';

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
            <Route path="dashboard" element={<div>dash</div>} />
            <Route path="account" element={<div>account</div>} />
          </Route>
          <Route path="login" element={<div>login</div>} />
          <Route path="signup" element={<div>signup</div>} />
          <Route path="*" element={<div>error</div>} />
        </Routes>
      </BrowserRouter>
    </ViewProvider>
    <Toaster richColors duration={3000} position="bottom-center" />
  </QueryClientProvider >

}

export default App
