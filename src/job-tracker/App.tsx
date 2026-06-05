import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import DeliveryList from './pages/DeliveryList';
import DeliveryDetail from './pages/DeliveryDetail';
import Analytics from './pages/Analytics';
import DataManager from './pages/DataManager';
import TodoList from './pages/TodoList';
import InterviewNoteList from './pages/InterviewNoteList';
import RecycleBin from './pages/RecycleBin';
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { useThemeStore } from './stores/themeStore';
import { AuthProvider, useAuthMode } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { setDataSource } from './services/dataSource';
import { useDeliveryStore } from './stores/deliveryStore';
import { syncLocalDataToCloud, checkCloudDataExists, checkLocalDataExists } from './services/syncService';
import { restoreFromCloud } from './services/cloudRestore';
import { switchDatabase } from './services/db';
import { message } from 'antd';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { mode } = useAuthMode();
  const { fetchDeliveries } = useDeliveryStore();
  const [initialized, setInitialized] = React.useState(false);

  // 使用 userId 来跟踪是否已经为该用户执行过同步
  const lastSyncedUserId = React.useRef<string | null>(null);

  React.useEffect(() => {
    async function init() {
      if (mode === 'logged_in' && user) {
        setDataSource('supabase');
        // 按用户ID切换本地数据库（账号隔离）
        await switchDatabase(user.id);
        // 登录后自动同步（每个用户只执行一次）
        if (lastSyncedUserId.current !== user.id) {
          lastSyncedUserId.current = user.id;
          try {
            const hasCloudData = await checkCloudDataExists();
            const hasLocalData = await checkLocalDataExists();
            console.log('[SyncCheck] 云端有数据:', hasCloudData, '本地有数据:', hasLocalData);

            if (!hasCloudData && hasLocalData) {
              // 本地有数据，云端没有 → 自动推送
              console.log('[SyncCheck] 本地有数据，云端没有，自动推送');
              message.loading('正在同步数据到云端...', 0);
              try {
                const result = await syncLocalDataToCloud();
                message.destroy();
                const msg = [
                  `投递: +${result.deliveries.inserted}/-${result.deliveries.deleted}`,
                  `待办: +${result.todos.inserted}/-${result.todos.deleted}`,
                  `面经: +${result.interviewNotes.inserted}/-${result.interviewNotes.deleted}`,
                ].join('，');
                message.success(`同步完成：${msg}`);
              } catch (error: any) {
                message.destroy();
                message.error('自动同步失败：' + (error?.message || '未知错误'));
              }
            } else if (hasCloudData && !hasLocalData) {
              // 云端有数据，本地没有 → 自动恢复
              console.log('[SyncCheck] 云端有数据，本地没有，自动恢复');
              message.loading('正在从云端恢复数据...', 0);
              try {
                const result = await restoreFromCloud();
                message.destroy();
                message.success(`恢复完成：${result.deliveries} 条投递、${result.todos} 条待办、${result.interviewNotes} 条面经`);
              } catch (error: any) {
                message.destroy();
                message.error('自动恢复失败：' + (error?.message || '未知错误'));
              }
            } else if (hasCloudData && hasLocalData) {
              // 两边都有数据 → 自动双向同步（合并）
              console.log('[SyncCheck] 两边都有数据，自动双向同步');
              message.loading('正在同步数据...', 0);
              try {
                const result = await syncLocalDataToCloud();
                message.destroy();
                const msg = [
                  `投递: +${result.deliveries.inserted}/-${result.deliveries.deleted}`,
                  `待办: +${result.todos.inserted}/-${result.todos.deleted}`,
                  `面经: +${result.interviewNotes.inserted}/-${result.interviewNotes.deleted}`,
                ].join('，');
                message.success(`同步完成：${msg}`);
              } catch (error: any) {
                message.destroy();
                message.error('自动同步失败：' + (error?.message || '未知错误'));
              }
            }
          } catch (e) {
            console.warn('自动同步/恢复失败:', e);
          }
        }
      }
      fetchDeliveries();
      setInitialized(true);
    }
    init();
  }, [mode, user, fetchDeliveries]);

  if (!initialized) return null;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { mode } = useAuthMode();
  if (mode === 'none') {
    return <Navigate to="/login" replace />;
  }
  return <AppInitializer>{children}</AppInitializer>;
}

const AppContent: React.FC = () => {
  const { themeConfig } = useThemeStore();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: themeConfig.primary,
          colorBgContainer: themeConfig.bgContainer,
          colorBorder: themeConfig.border,
          colorText: themeConfig.text,
          borderRadius: 8,
          fontFamily: themeConfig.fontFamily
        },
        components: {
          Menu: {
            itemSelectedBg: themeConfig.primary + '15',
            itemSelectedColor: themeConfig.primary,
          },
          Card: {
            colorBgContainer: themeConfig.cardBg,
          }
        }
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/deliveries" element={<DeliveryList />} />
                    <Route path="/deliveries/:id" element={<DeliveryDetail />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/todos" element={<TodoList />} />
                    <Route path="/interview-notes" element={<InterviewNoteList />} />
                    <Route path="/data" element={<DataManager />} />
                    <Route path="/recycle-bin" element={<RecycleBin />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
