import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
