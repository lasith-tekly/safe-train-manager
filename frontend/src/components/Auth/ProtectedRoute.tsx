import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
