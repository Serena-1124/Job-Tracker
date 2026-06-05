import React, { useEffect, useState } from 'react';
import { Card, Button, Descriptions, Modal, message, Popconfirm, Timeline, List, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, LinkOutlined, FileOutlined, DownloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryStore } from '../stores/deliveryStore';
import StatusTag from '../components/common/StatusTag';
import DeliveryForm from '../components/delivery/DeliveryForm';
import type { Delivery, CreateDeliveryDTO } from '../types';
import dayjs from 'dayjs';

const { Text, Link } = Typography;

const DeliveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deliveries, updateDelivery, deleteDelivery } = useDeliveryStore();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const found = deliveries.find(d => d.id === id);
      if (found) {
        setDelivery(found);
      }
    }
  }, [id, deliveries]);

  const handleUpdate = async (values: any) => {
    if (!delivery) return;
    
    const data: CreateDeliveryDTO = {
      companyName: values.companyName,
      positionName: values.positionName,
      deliveryMethod: values.deliveryMethod,
      deliveryDate: values.deliveryDate ? (dayjs.isDayjs(values.deliveryDate) ? values.deliveryDate.format('YYYY-MM-DD') : values.deliveryDate) : undefined,
      interviewDate: values.interviewDate ? (dayjs.isDayjs(values.interviewDate) ? values.interviewDate.format('YYYY-MM-DD') : values.interviewDate) : undefined,
      status: values.status,
      industryName: values.industryName,
      positionTypeName: values.positionTypeName,
      location: values.location,
      salary: values.salary,
      remark: values.remark,
      links: values.links || [],
      files: values.files || []
    };
    
    await updateDelivery(delivery.id, data, values.companyName, values.positionName);
    setEditModalVisible(false);
    message.success('更新成功');
  };
  
  const handleDelete = async () => {
    if (!delivery) return;
    await deleteDelivery(delivery.id);
    message.success('删除成功');
    navigate('/deliveries');
  };
  
  const handleDownloadFile = (file: { name: string; data?: string; url?: string }) => {
    const fileSrc = file.url || file.data;
    if (!fileSrc) return;
    const link = document.createElement('a');
    link.href = fileSrc;
    link.download = file.name;
    link.click();
  };

  const handlePreviewImage = (file: { name: string; url?: string; data?: string; type?: string }) => {
    const imgSrc = file.url || file.data;
    if (imgSrc) {
      setPreviewImage(imgSrc);
    }
  };

  const isImageFile = (file: { name: string; type?: string }) => {
    if (!file.type) return false;
    return file.type.startsWith('image/') || !!file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  };
  
  if (!delivery) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>未找到该投递记录</p>
        <Button onClick={() => navigate('/deliveries')}>返回列表</Button>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/deliveries')}
          style={{ border: 'none', marginRight: 16 }}
        >
          返回
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setEditModalVisible(true)}
          className="edit-btn"
        >
          编辑
        </Button>
        <Popconfirm
          title="确认删除"
          description="确定要删除这条投递记录吗？"
          onConfirm={handleDelete}
          okText="确认"
          cancelText="取消"
        >
          <Button 
            danger
            icon={<DeleteOutlined />}
            style={{ marginLeft: 8 }}
          >
            删除
          </Button>
        </Popconfirm>
      </div>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: '#5D5348' }}>
              {delivery.companyName}
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 16, color: '#9B9285' }}>
              {delivery.positionName}
            </p>
          </div>
          <StatusTag status={delivery.status} />
        </div>
        
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="投递方式">{delivery.deliveryMethod}</Descriptions.Item>
          <Descriptions.Item label="投递日期">{delivery.deliveryDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="面试日期">{delivery.interviewDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="行业">{delivery.industryName || '-'}</Descriptions.Item>
          <Descriptions.Item label="岗位">{delivery.positionTypeName || '-'}</Descriptions.Item>
          <Descriptions.Item label="工作地点">{delivery.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="薪资范围">{delivery.salary || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(delivery.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
        
        {delivery.remark && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">备注：</Text>
            <p style={{ marginTop: 4, color: '#5D5348', whiteSpace: 'pre-wrap' }}>
              {delivery.remark}
            </p>
          </div>
        )}
      </Card>
      
      {delivery.links.length > 0 && (
        <Card title={<span style={{ fontSize: 15, fontWeight: 500 }}>链接</span>} style={{ marginBottom: 24 }}>
          <List
            size="small"
            dataSource={delivery.links}
            renderItem={(link) => (
              <List.Item>
                <Link href={link} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined style={{ marginRight: 8 }} />
                  {link}
                </Link>
              </List.Item>
            )}
          />
        </Card>
      )}
      
      {delivery.files.length > 0 && (
        <Card title={<span style={{ fontSize: 15, fontWeight: 500 }}>附件</span>} style={{ marginBottom: 24 }}>
          <List
            size="small"
            dataSource={delivery.files}
            renderItem={(file) => (
              <List.Item
                actions={[
                  isImageFile(file) && (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => handlePreviewImage(file)}
                    >
                      预览
                    </Button>
                  ),
                  <Button 
                    type="link" 
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadFile(file)}
                  >
                    下载
                  </Button>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<FileOutlined style={{ color: '#9B9285' }} />}
                  title={file.name}
                  description={`${(file.size / 1024).toFixed(1)} KB`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
      
      <Card title={<span style={{ fontSize: 15, fontWeight: 500 }}>状态时间线</span>}>
        {delivery.timeline.length > 0 ? (
          <Timeline
            items={delivery.timeline.map((entry, index) => ({
              color: index === 0 ? '#B5A99A' : '#D4C5B5',
              children: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontWeight: 500, color: '#5D5348' }}>
                    {entry.from ? `${entry.from} → ${entry.to}` : entry.to}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B9285', marginTop: 2 }}>
                    {dayjs(entry.time).format('YYYY-MM-DD HH:mm')}
                    {entry.note && ` · ${entry.note}`}
                  </div>
                </div>
              )
            }))}
          />
        ) : (
          <Text type="secondary">暂无时间线记录</Text>
        )}
      </Card>
      
      <Modal
        title="编辑投递记录"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <DeliveryForm
          initialValues={delivery}
          onSubmit={handleUpdate}
          onCancel={() => setEditModalVisible(false)}
        />
      </Modal>

      <Modal
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        closable
        width="70%"
        centered
      >
        <img src={previewImage || ''} alt="预览" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
      </Modal>
    </div>
  );
};

export default DeliveryDetail;