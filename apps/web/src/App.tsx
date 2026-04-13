import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from '@/router';
import { ErrorBoundary } from '@/global/components/ErrorBoundary';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
          offset="max(calc(env(safe-area-inset-top, 0px) + 8px), 16px)"
          toastOptions={{
            style: { fontSize: '14px' },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
