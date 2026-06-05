import React, { useEffect } from 'react';
import { Card, Button, Empty, message, Modal, Table, Tag } from 'antd';
import { RollbackOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useDeliveryStore } from '../stores/deliveryStore';
import dayjs from 'dayjs';

const RecycleBin: React.FC = () => {
  const { recycleBin, fetchRecycleBin, restoreFromRecycleBin, permanentDelete } = useDeliveryStore();

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleRestore = async (originalId: string) => {
    try {
      await restoreFromRecycleBin(originalId);
      message.success('恢复成功');
    } catch (error: any) {
      message.error(error?.message || '恢复失败');
    }
  };

  const handlePermanentDelete = async (originalId: string, companyName: string) => {
    Modal.confirm({
      title: '确认永久删除',
      icon: <DeleteOutlined style={{ color: '#D4A574' }} />,
      content: `确定要永久删除 "${companyName}" 吗？此操作不可恢复。`,
      okText: '永久删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await permanentDelete(originalId);
          message.success('已永久删除');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const getRemainingDays = (deletedAt: string) => {
    const deleted = dayjs(deletedAt);
    const expireDate = deleted.add(30, 'day');
    const remaining = expireDate.diff(dayjs(), 'day');
    return Math.max(0, remaining);
  };

  const columns = [
    {
      title: '公司',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => <span style={{ fontWeight: 500, color: '#5D5348' }}>{text}</span>,
    },
    {
      title: '岗位',
      dataIndex: 'positionName',
      key: 'positionName',
      render: (text: string) => <span style={{ color: '#8B7355' }}>{text}</span>,
    },
    {
      title: '行业',
      key: 'industry',
      render: (_: any, record: any) => {
        const name = record.industryName;
        const color = record.industryColor;
        return name && color ? (
          <Tag style={{ background: color + '20', color: color, borderColor: color + '40' }}>
            {name}
          </Tag>
        ) : '-';
      },
    },
    {
      title: '岗位类型',
      key: 'positionType',
      render: (_: any, record: any) => {
        const name = record.positionTypeName;
        const color = record.positionTypeColor;
        return name && color ? (
          <Tag style={{ background: color + '20', color: color, borderColor: color + '40' }}>
            {name}
          </Tag>
        ) : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <span style={{ color: '#9B9285' }}>{status}</span>,
    },
    {
      title: '删除时间',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '剩余天数',
      key: 'remaining',
      render: (_: any, record: any) => {
        const days = getRemainingDays(record.deletedAt);
        return (
          <span style={{ color: days <= 3 ? '#E07A5F' : '#9B9285', fontSize: 13 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {days} 天
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRestore(record.originalId)}
            style={{ background: '#6B8B6B', borderColor: '#6B8B6B' }}
          >
            恢复
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handlePermanentDelete(record.originalId, record.companyName)}
          >
            彻底删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#5D5348', fontFamily: 'Noto Serif SC, serif' }}>
            回收站
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#9B9285' }}>
            已删除的投递记录将在 30 天后自动清除
          </p>
        </div>
      </div>

      {recycleBin.length > 0 ? (
        <Card
          style={{ borderRadius: 12, border: '1px solid #E8E0D5' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={recycleBin}
            columns={columns}
            rowKey="originalId"
            pagination={false}
            style={{ background: '#fff' }}
          />
        </Card>
      ) : (
        <Empty
          description="回收站为空"
          style={{ marginTop: 80 }}
        />
      )}
    </div>
  );
};

export default RecycleBin;
