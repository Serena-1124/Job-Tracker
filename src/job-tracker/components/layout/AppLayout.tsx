import React, { useState } from 'react';
import { Layout, Menu, Drawer, Button, Space, message, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, FileTextOutlined, DatabaseOutlined, BarChartOutlined, SkinOutlined, CheckSquareOutlined, LogoutOutlined, ExclamationCircleOutlined, DeleteFilled, BookOutlined } from '@ant-design/icons';
import { useThemeStore, themes, type ThemeName } from '../../stores/themeStore';
import { useAuthMode } from '../../contexts/AuthContext';
import { signOut } from '../../services/supabaseClient';
import { switchDatabase } from '../../services/db';


const { Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, themeConfig, setTheme } = useThemeStore();
  const { setNone } = useAuthMode();
  const [themeDrawerVisible, setThemeDrawerVisible] = useState(false);

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      icon: <ExclamationCircleOutlined style={{ color: '#D4A574' }} />,
      content: '退出后需要重新登录才能访问云端数据',
      okText: '确认退出',
      cancelText: '取消',
      onOk: async () => {
        try {
          await signOut();
          await switchDatabase(null);
          setNone();
          message.success('已退出登录');
          navigate('/login');
        } catch (error) {
          message.error('退出失败');
        }
      }
    });
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/deliveries',
      icon: <FileTextOutlined />,
      label: '投递列表',
    },

    {
      key: '/todos',
      icon: <CheckSquareOutlined />,
      label: '待办事项',
    },
    {
      key: '/interview-notes',
      icon: <BookOutlined />,
      label: '面经记录',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/data',
      icon: <DatabaseOutlined />,
      label: '数据管理',
    },
    {
      key: '/recycle-bin',
      icon: <DeleteFilled />,
      label: '回收站',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: themeConfig.sidebarBg,
          borderRight: `1px solid ${themeConfig.sidebarBorder}`
        }}
      >
        <div style={{
          height: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${themeConfig.sidebarBorder}`,
          padding: '16px 0'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: themeConfig.headerText,
            fontFamily: themeConfig.fontFamily,
            letterSpacing: 2
          }}>
            JobTracker
          </h1>
          <span style={{
            fontSize: 11,
            color: themeConfig.textSecondary,
            marginTop: 4
          }}>
            求职进度管理
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 8,
            flex: 1
          }}
        />
        <div style={{
          borderTop: `1px solid ${themeConfig.sidebarBorder}`,
          padding: '12px 16px',
          marginTop: 'auto'
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Button
              type="text"
              icon={<SkinOutlined />}
              onClick={() => setThemeDrawerVisible(true)}
              style={{
                color: themeConfig.textSecondary,
                fontSize: 13,
                width: '100%',
                justifyContent: 'flex-start'
              }}
            >
              主题切换
            </Button>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                color: themeConfig.textSecondary,
                fontSize: 13,
                width: '100%',
                justifyContent: 'flex-start'
              }}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Sider>
      <Layout>
        <Content style={{
          padding: 24,
          background: themeConfig.bgPage,
          minHeight: '100vh'
        }}>
          {children}
        </Content>
      </Layout>

      <Drawer
        title="选择主题"
        placement="right"
        onClose={() => setThemeDrawerVisible(false)}
        open={themeDrawerVisible}
        width={300}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {(Object.keys(themes) as ThemeName[]).map((themeName) => {
            const theme = themes[themeName];
            const isActive = currentTheme === themeName;
            return (
              <div
                key={themeName}
                onClick={() => {
                  setTheme(themeName);
                  setThemeDrawerVisible(false);
                }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: `2px solid ${isActive ? theme.primary : theme.border}`,
                  background: theme.bgContainer,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: theme.primary
                  }} />
                  <div>
                    <div style={{
                      fontWeight: 600,
                      color: theme.text,
                      fontSize: 14
                    }}>
                      {theme.label}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginTop: 2
                    }}>
                      {themeName === 'beige' && '温暖淡雅，舒适自然'}
                      {themeName === 'coffee' && '经典沉稳，品味质感'}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 12
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: theme.primary
                  }} />
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: theme.accent
                  }} />
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: theme.bgPage,
                    border: `1px solid ${theme.border}`
                  }} />
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: theme.cardBg,
                    border: `1px solid ${theme.border}`
                  }} />
                </div>
              </div>
            );
          })}
        </Space>
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
