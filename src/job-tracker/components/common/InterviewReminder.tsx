import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Badge, List, Typography } from 'antd';
import { ClockCircleOutlined, BellOutlined } from '@ant-design/icons';
import { useDeliveryStore } from '../../stores/deliveryStore';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ReminderItem {
  id: string;
  companyName: string;
  positionName: string;
  interviewDate: string;
  minutesLeft: number;
}

const InterviewReminder: React.FC = () => {
  const { deliveries, fetchDeliveries } = useDeliveryStore();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const checkInterviews = useCallback(() => {
    const now = dayjs();
    const upcoming: ReminderItem[] = [];

    deliveries.forEach(d => {
      if (!d.interviewDate || dismissedIds.has(d.id)) return;

      const interviewTime = dayjs(d.interviewDate);
      const diffMinutes = interviewTime.diff(now, 'minute');

      // 提醒时间：面试前1小时内
      if (diffMinutes > 0 && diffMinutes <= 60) {
        upcoming.push({
          id: d.id,
          companyName: d.companyName,
          positionName: d.positionName,
          interviewDate: d.interviewDate,
          minutesLeft: diffMinutes
        });
      }
    });

    // 按时间排序
    upcoming.sort((a, b) => a.minutesLeft - b.minutesLeft);

    if (upcoming.length > 0) {
      setReminders(upcoming);
      setModalVisible(true);
    }
  }, [deliveries, dismissedIds]);

  useEffect(() => {
    // 初始检查
    const timer = setTimeout(checkInterviews, 3000);

    // 每5分钟检查一次
    const interval = setInterval(checkInterviews, 5 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkInterviews]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setReminders(prev => prev.filter(r => r.id !== id));
    if (reminders.length <= 1) {
      setModalVisible(false);
    }
  };

  const handleDismissAll = () => {
    const allIds = reminders.map(r => r.id);
    setDismissedIds(prev => new Set([...prev, ...allIds]));
    setReminders([]);
    setModalVisible(false);
  };

  const formatTimeLeft = (minutes: number) => {
    if (minutes <= 0) return '即将开始';
    if (minutes < 60) return `${minutes}分钟后`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}后`;
  };

  if (reminders.length === 0) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined style={{ color: '#E07A5F', fontSize: 20 }} />
          <span>面试提醒</span>
          <Badge count={reminders.length} style={{ backgroundColor: '#E07A5F' }} />
        </div>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="dismiss-all" onClick={handleDismissAll}>
          全部忽略
        </Button>,
        <Button key="ok" type="primary" onClick={() => setModalVisible(false)}>
          知道了
        </Button>
      ]}
      width={480}
    >
      <List
        dataSource={reminders}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="dismiss"
                type="link"
                size="small"
                onClick={() => handleDismiss(item.id)}
              >
                忽略
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <span style={{ fontWeight: 600 }}>
                  {item.companyName} - {item.positionName}
                </span>
              }
              description={
                <div style={{ marginTop: 4 }}>
                  <ClockCircleOutlined style={{ color: '#E07A5F', marginRight: 4 }} />
                  <Text type="secondary">
                    面试时间：{dayjs(item.interviewDate).format('MM月DD日 HH:mm')}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Badge
                      status="processing"
                      text={
                        <Text style={{ color: '#E07A5F', fontWeight: 500 }}>
                          {formatTimeLeft(item.minutesLeft)}
                        </Text>
                      }
                    />
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default InterviewReminder;
