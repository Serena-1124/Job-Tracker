import React, { useEffect, useState } from 'react';
import { Card, Button, message, Space, Typography, Row, Col, Statistic, Checkbox } from 'antd';
import { DownloadOutlined, FileTextOutlined, CheckSquareOutlined, BookOutlined, CloudSyncOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useTodoStore } from '../stores/todoStore';
import { useInterviewNoteStore } from '../stores/interviewNoteStore';
import { useAuthMode } from '../contexts/AuthContext';
import {
  exportDeliveriesToExcel,
  exportDeliveriesToCSV,
  exportTodosToExcel,
  exportTodosToCSV,
  exportInterviewNotesToExcel,
  exportInterviewNotesToCSV,
  DELIVERY_EXPORT_FIELDS,
  TODO_EXPORT_FIELDS,
  INTERVIEW_NOTE_EXPORT_FIELDS,
  type DeliveryExportFieldKey,
  type TodoExportFieldKey,
  type InterviewNoteExportFieldKey
} from '../services/exportService';
import { syncLocalDataToCloud, getCloudDataStats } from '../services/syncService';
import { restoreFromCloud } from '../services/cloudRestore';

const { Text } = Typography;

const DataManager: React.FC = () => {
  const { deliveries, fetchDeliveries } = useDeliveryStore();
  const { todos, fetchTodos } = useTodoStore();
  const { notes, fetchNotes } = useInterviewNoteStore();
  const { mode: authMode } = useAuthMode();

  // 导出字段选择状态
  const [deliveryFields, setDeliveryFields] = useState<DeliveryExportFieldKey[]>(
    DELIVERY_EXPORT_FIELDS.filter(f => f.default).map(f => f.key)
  );
  const [todoFields, setTodoFields] = useState<TodoExportFieldKey[]>(
    TODO_EXPORT_FIELDS.filter(f => f.default).map(f => f.key)
  );
  const [noteFields, setNoteFields] = useState<InterviewNoteExportFieldKey[]>(
    INTERVIEW_NOTE_EXPORT_FIELDS.filter(f => f.default).map(f => f.key)
  );

  useEffect(() => {
    fetchDeliveries();
    fetchTodos();
    fetchNotes();
  }, []);

  // 获取云端数据统计
  const loadCloudStats = async () => {
    if (authMode !== 'logged_in') return;
    setLoadingStats(true);
    try {
      const stats = await getCloudDataStats();
      setCloudStats(stats);
    } catch (e) {
      console.warn('获取云端统计失败:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadCloudStats();
  }, [authMode]);

  const pendingTodos = todos.filter(t => !t.completed).length;
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [cloudStats, setCloudStats] = useState({ deliveries: 0, todos: 0, interviewNotes: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // 投递记录导出
  const handleExportDeliveriesExcel = async () => {
    if (deliveryFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportDeliveriesToExcel(deliveries, deliveryFields);
      message.success('投递记录导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleExportDeliveriesCSV = async () => {
    if (deliveryFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportDeliveriesToCSV(deliveries, deliveryFields);
      message.success('投递记录导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 待办事项导出
  const handleExportTodosExcel = async () => {
    if (todoFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportTodosToExcel(todos, todoFields);
      message.success('待办事项导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleExportTodosCSV = async () => {
    if (todoFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportTodosToCSV(todos, todoFields);
      message.success('待办事项导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 手动同步到云端
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncLocalDataToCloud();
      const msg = [
        `投递: +${result.deliveries.inserted}/-${result.deliveries.deleted}`,
        `待办: +${result.todos.inserted}/-${result.todos.deleted}`,
        `面经: +${result.interviewNotes.inserted}/-${result.interviewNotes.deleted}`,
      ].join('，');
      message.success(`同步完成：${msg}`);
      // 同步成功后清除"稍后再说"标记
      localStorage.removeItem('job-tracker-sync-postponed');
      // 刷新云端统计
      await loadCloudStats();
      // 刷新本地数据
      await fetchDeliveries();
      await fetchTodos();
      await fetchNotes();
    } catch (error: any) {
      message.error('同步失败：' + (error?.message || '未知错误'));
    } finally {
      setSyncing(false);
    }
  };

  // 从云端恢复数据
  const handleRestoreFromCloud = async () => {
    setRestoring(true);
    try {
      const result = await restoreFromCloud();
      message.success(`恢复完成：${result.deliveries} 条投递、${result.todos} 条待办、${result.interviewNotes} 条面经`);
      // 刷新本地数据
      await fetchDeliveries();
      await fetchTodos();
      await fetchNotes();
      // 刷新云端统计
      await loadCloudStats();
    } catch (error: any) {
      message.error('恢复失败：' + (error?.message || '未知错误'));
    } finally {
      setRestoring(false);
    }
  };

  // 面经记录导出
  const handleExportNotesExcel = async () => {
    if (noteFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportInterviewNotesToExcel(notes, noteFields);
      message.success('面经记录导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleExportNotesCSV = async () => {
    if (noteFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    try {
      await exportInterviewNotesToCSV(notes, noteFields);
      message.success('面经记录导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#5D5348', fontFamily: 'Noto Serif SC, serif' }}>
            数据管理
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#9B9285' }}>导出和备份数据</p>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title={<span style={{ color: '#9B9285', fontSize: 14 }}>投递记录</span>}
              value={deliveries.length}
              prefix={<FileTextOutlined style={{ color: '#D4A574', marginRight: 8 }} />}
              valueStyle={{ color: '#5D5348', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title={<span style={{ color: '#9B9285', fontSize: 14 }}>待办事项</span>}
              value={todos.length}
              suffix={pendingTodos > 0 ? `(${pendingTodos} 待完成)` : ''}
              prefix={<CheckSquareOutlined style={{ color: '#8B7355', marginRight: 8 }} />}
              valueStyle={{ color: '#5D5348', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title={<span style={{ color: '#9B9285', fontSize: 14 }}>面经记录</span>}
              value={notes.length}
              prefix={<BookOutlined style={{ color: '#6B8B6B', marginRight: 8 }} />}
              valueStyle={{ color: '#5D5348', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 投递记录导出 */}
      <Card
        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#5D5348' }}>投递记录导出</span>}
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#5D5348', fontWeight: 500, display: 'block', marginBottom: 8 }}>
            选择导出字段：
          </Text>
          <Checkbox.Group
            value={deliveryFields}
            onChange={(value) => setDeliveryFields(value as DeliveryExportFieldKey[])}
          >
            <Row gutter={[16, 8]}>
              {DELIVERY_EXPORT_FIELDS.map(field => (
                <Col span={6} key={field.key}>
                  <Checkbox value={field.key}>{field.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportDeliveriesExcel}
            style={{
              background: '#B5A99A',
              borderColor: '#B5A99A',
              borderRadius: 8
            }}
          >
            导出 Excel
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportDeliveriesCSV}
            style={{ borderRadius: 8 }}
          >
            导出 CSV
          </Button>
        </Space>
      </Card>

      {/* 待办事项导出 */}
      <Card
        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#5D5348' }}>待办事项导出</span>}
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#5D5348', fontWeight: 500, display: 'block', marginBottom: 8 }}>
            选择导出字段：
          </Text>
          <Checkbox.Group
            value={todoFields}
            onChange={(value) => setTodoFields(value as TodoExportFieldKey[])}
          >
            <Row gutter={[16, 8]}>
              {TODO_EXPORT_FIELDS.map(field => (
                <Col span={6} key={field.key}>
                  <Checkbox value={field.key}>{field.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportTodosExcel}
            style={{
              background: '#8B7355',
              borderColor: '#8B7355',
              borderRadius: 8
            }}
          >
            导出 Excel
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportTodosCSV}
            style={{ borderRadius: 8 }}
          >
            导出 CSV
          </Button>
        </Space>
      </Card>

      {/* 面经记录导出 */}
      <Card
        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#5D5348' }}>面经记录导出</span>}
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#5D5348', fontWeight: 500, display: 'block', marginBottom: 8 }}>
            选择导出字段：
          </Text>
          <Checkbox.Group
            value={noteFields}
            onChange={(value) => setNoteFields(value as InterviewNoteExportFieldKey[])}
          >
            <Row gutter={[16, 8]}>
              {INTERVIEW_NOTE_EXPORT_FIELDS.map(field => (
                <Col span={6} key={field.key}>
                  <Checkbox value={field.key}>{field.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportNotesExcel}
            style={{
              background: '#6B8B6B',
              borderColor: '#6B8B6B',
              borderRadius: 8
            }}
          >
            导出 Excel
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportNotesCSV}
            style={{ borderRadius: 8 }}
          >
            导出 CSV
          </Button>
        </Space>
      </Card>

      {/* 手动同步按钮 - 仅登录用户显示 */}
      {authMode === 'logged_in' && (
        <Card
          title={<span style={{ fontSize: 15, fontWeight: 500, color: '#5D5348' }}>云端同步</span>}
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 云端数据量统计 */}
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px 0', background: '#FAF7F4', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#5D5348' }}>
                    {loadingStats ? '-' : cloudStats.deliveries}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B9285', marginTop: 4 }}>云端投递</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px 0', background: '#FAF7F4', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#5D5348' }}>
                    {loadingStats ? '-' : cloudStats.todos}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B9285', marginTop: 4 }}>云端待办</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px 0', background: '#FAF7F4', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#5D5348' }}>
                    {loadingStats ? '-' : cloudStats.interviewNotes}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B9285', marginTop: 4 }}>云端面经</div>
                </div>
              </Col>
            </Row>
            <Text style={{ color: '#9B9285', fontSize: 14 }}>
              您当前为登录模式，所有操作先保存到本地浏览器，5~10 秒内自动同步到云端。更换设备登录时，数据会自动从云端恢复到本地。
            </Text>
            <Text style={{ color: '#9B9285', fontSize: 14 }}>
              如遇同步或恢复异常，可刷新页面重试，或使用下方按钮手动刷新统计、同步或恢复。
            </Text>
            <Space>
              <Button
                onClick={loadCloudStats}
                loading={loadingStats}
                style={{ borderRadius: 8 }}
              >
                刷新统计
              </Button>
              <Button
                type="primary"
                icon={<CloudSyncOutlined />}
                loading={syncing}
                onClick={handleManualSync}
                style={{
                  background: '#B5A99A',
                  borderColor: '#B5A99A',
                  borderRadius: 8,
                  width: 'fit-content'
                }}
              >
                {syncing ? '同步中...' : '立即同步到云端'}
              </Button>
              <Button
                icon={<CloudDownloadOutlined />}
                loading={restoring}
                onClick={handleRestoreFromCloud}
                style={{ borderRadius: 8 }}
              >
                {restoring ? '恢复中...' : '从云端恢复'}
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {/* 数据安全提示 */}
      <Card
        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#5D5348' }}>数据安全提示</span>}
        styles={{ body: { padding: 24 } }}
      >
        <ul style={{ color: '#9B9285', lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          <li>您已登录账号，数据采用「本地+云端」双存储机制</li>
          <li>离线时可正常使用，数据先保存到本地浏览器，联网后 5~10 秒内自动同步到云端</li>
          <li>建议定期导出数据备份到本地文件，作为额外保障</li>
        </ul>
      </Card>

    </div>
  );
};

export default DataManager;
