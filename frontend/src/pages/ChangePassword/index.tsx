import { useState } from 'react';
import { Form, Input, Button, Card, message, Result } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../config/api';

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMandatory = user?.must_change_password ?? false;

  const handleSubmit = async (values: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    if (values.new_password !== values.confirm_password) {
      message.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/users/change-password`, {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      setDone(true);
    } catch (err) {
      const detail = err instanceof Error
        ? err.message
        : (err as any)?.response?.data?.detail;
      message.error(detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
          title="Password changed successfully!"
          subTitle="Please sign in again with your new password."
          extra={
            <Button type="primary" onClick={() => { logout(); }}>
              Sign in again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5',
    }}>
      <Card style={{ width: 420, borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#1677ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <LockOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {isMandatory ? 'Change Your Password' : 'Update Password'}
          </h2>
          {isMandatory && (
            <p style={{
              marginTop: 8, fontSize: 13, color: '#f59e0b',
              background: '#fef3c7', padding: '8px 12px',
              borderRadius: 6, border: '1px solid #fde68a',
            }}>
              You must change your password before continuing.
            </p>
          )}
          {!isMandatory && (
            <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
              Update your account password
            </p>
          )}
        </div>

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Current Password"
            name="current_password"
            rules={[{ required: true,
              message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Current password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New password (min 8 characters)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirm_password"
            rules={[{ required: true,
              message: 'Please confirm your new password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Change Password
            </Button>
          </Form.Item>

          {!isMandatory && (
            <Button
              type="link"
              block
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          )}
        </Form>
      </Card>
    </div>
  );
}
