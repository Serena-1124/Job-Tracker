import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查 URL 中是否有 access_token（Supabase 重置密码链接会带这个参数）
    const hash = window.location.hash;
    const search = window.location.search;

    // 如果有 access_token，说明是从邮件链接过来的
    if (hash.includes('access_token') || search.includes('access_token')) {
      setValidating(false);
    } else {
      // 没有 token，可能是直接访问这个页面
      message.error('无效的密码重置链接');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate]);

  const handleReset = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      message.success('密码重置成功，请使用新密码登录');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      message.error('重置失败: ' + (error?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAF7F4 0%, #F0EBE3 50%, #E8E0D5 100%)',
      }}>
        <Text style={{ color: '#9B9285' }}>正在验证链接...</Text>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF7F4 0%, #F0EBE3 50%, #E8E0D5 100%)',
      fontFamily: "'Noto Serif SC', serif",
    }}>
      <Card
        style={{
          width: 420,
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(181, 169, 154, 0.15)',
          border: '1px solid #E8E0D5',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#5D5348', margin: '0 0 8px', fontSize: 28 }}>
            重置密码
          </Title>
          <Text style={{ color: '#9B9285' }}>请输入您的新密码</Text>
        </div>

        <Form onFinish={handleReset} layout="vertical">
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#B5A99A' }} />}
              placeholder="新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认新密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#B5A99A' }} />}
              placeholder="确认新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{
                borderRadius: 12,
                background: '#B5A99A',
                borderColor: '#B5A99A',
                height: 48,
                fontSize: 16,
              }}
            >
              确认重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
