import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Divider, message, Card, Modal } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { loginOrAutoRegister, sendResetOTP, verifyOTPAndResetPassword } from '../services/supabaseClient';
import { useAuthMode } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'verify'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setLoggedIn } = useAuthMode();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await loginOrAutoRegister(values.email, values.password);
      setLoggedIn();
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error('登录失败: ' + (error?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendOTP = async (values: { email: string }) => {
    setForgotLoading(true);
    try {
      await sendResetOTP(values.email);
      setResetEmail(values.email);
      setForgotStep('verify');
      message.success('验证码已发送到您的邮箱，请查收');
      // 开始倒计时
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error('发送失败: ' + (error?.message || '未知错误'));
    } finally {
      setForgotLoading(false);
    }
  };

  // 验证验证码并重置密码
  const handleVerifyAndReset = async (values: { otp: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setForgotLoading(true);
    try {
      await verifyOTPAndResetPassword(resetEmail, values.otp.trim(), values.password);
      message.success('密码重置成功，请使用新密码登录');
      setForgotVisible(false);
      setForgotStep('email');
      setResetEmail('');
    } catch (error: any) {
      message.error('重置失败: ' + (error?.message || '验证码错误或已过期'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCloseForgot = () => {
    setForgotVisible(false);
    setForgotStep('email');
    setResetEmail('');
    setCountdown(0);
  };

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
            求职进度管理
          </Title>
          <Text style={{ color: '#9B9285' }}>让每一次投递都有迹可循</Text>
        </div>

        <style>{`
              .login-page .ant-input-affix-wrapper,
              .transparent-input-form .ant-input-affix-wrapper {
                background: transparent !important;
                border-color: #D4CFC7 !important;
              }
              .login-page .ant-input-affix-wrapper:hover,
              .login-page .ant-input-affix-wrapper:focus,
              .transparent-input-form .ant-input-affix-wrapper:hover,
              .transparent-input-form .ant-input-affix-wrapper:focus {
                border-color: #B5A99A !important;
              }
              .login-page .ant-input-affix-wrapper:focus-within,
              .transparent-input-form .ant-input-affix-wrapper:focus-within {
                box-shadow: 0 0 0 2px rgba(181, 169, 154, 0.15) !important;
              }
              .login-page .ant-input,
              .transparent-input-form .ant-input {
                background: transparent !important;
              }
              .login-page .ant-input::placeholder,
              .transparent-input-form .ant-input::placeholder {
                color: #C0B8AE;
              }
            `}</style>
            <Form className="login-page" onFinish={handleLogin} layout="vertical">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#B5A99A' }} />}
                  placeholder="邮箱"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#B5A99A' }} />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
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
                  登录
                </Button>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#C0B8AE' }}>
                  未注册账号将自动注册
                </Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setForgotVisible(true)}
                  style={{ padding: 0, fontSize: 12, color: '#B5A99A' }}
                >
                  忘记密码？
                </Button>
              </div>
            </Form>

            <Divider style={{ margin: '24px 0 16px' }} />

            <Paragraph style={{ fontSize: 11, color: '#C0B8AE', margin: 0, textAlign: 'center' }}>
              登录即代表您同意我们的
              <a onClick={() => navigate('/terms')} style={{ color: '#B5A99A', textDecoration: 'underline' }}>服务条款</a>
              和
              <a onClick={() => navigate('/privacy')} style={{ color: '#B5A99A', textDecoration: 'underline' }}>隐私政策</a>
            </Paragraph>
      </Card>

      {/* 忘记密码弹窗 */}
      <Modal
        title="重置密码"
        open={forgotVisible}
        onCancel={handleCloseForgot}
        footer={null}
        width={400}
      >
        {forgotStep === 'email' ? (
          <>
            <Text style={{ color: '#8B7355', display: 'block', marginBottom: 16 }}>
              请输入您的注册邮箱，我们将发送6位数字验证码到您的邮箱。
            </Text>
            <Form onFinish={handleSendOTP} layout="vertical" className="transparent-input-form">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#B5A99A' }} />}
                  placeholder="邮箱"
                  size="large"
                  style={{ background: 'transparent' }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={forgotLoading}
                  size="large"
                  block
                  style={{
                    borderRadius: 12,
                    background: '#B5A99A',
                    borderColor: '#B5A99A',
                  }}
                >
                  发送验证码
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <Text style={{ color: '#8B7355', display: 'block', marginBottom: 16 }}>
              验证码已发送至 <strong>{resetEmail}</strong>，请输入6位验证码并设置新密码。
            </Text>
            <Form onFinish={handleVerifyAndReset} layout="vertical" className="transparent-input-form">
              <Form.Item
                name="otp"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码为6位数字' },
                ]}
              >
                <Input
                  placeholder="请输入6位验证码"
                  size="large"
                  maxLength={6}
                  style={{ background: 'transparent', textAlign: 'center', letterSpacing: 8, fontSize: 18 }}
                />
              </Form.Item>
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
                  style={{ background: 'transparent' }}
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
                  style={{ background: 'transparent' }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={forgotLoading}
                  size="large"
                  block
                  style={{
                    borderRadius: 12,
                    background: '#B5A99A',
                    borderColor: '#B5A99A',
                    marginBottom: 12,
                  }}
                >
                  确认重置
                </Button>
                <Button
                  type="link"
                  block
                  disabled={countdown > 0}
                  onClick={() => {
                    if (resetEmail) {
                      handleSendOTP({ email: resetEmail });
                    }
                  }}
                  style={{ color: countdown > 0 ? '#C0B8AE' : '#B5A99A' }}
                >
                  {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
