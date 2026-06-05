import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Input, Select, DatePicker, Button, Modal, Empty, message, Space, Dropdown, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, DragOutlined } from '@ant-design/icons';

import { useDeliveryStore } from '../stores/deliveryStore';
import DeliveryCard from '../components/delivery/DeliveryCard';
import DeliveryForm from '../components/delivery/DeliveryForm';
import StatusTag from '../components/common/StatusTag';

import type { Delivery, CreateDeliveryDTO, DeliveryStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

const DELIVERY_STATUSES: DeliveryStatus[] = [
  '待投递', '仅沟通', '已投递', '通过初筛', '笔试', '一面', '二面', '三面', '已Offer', '未通过', '已接受', '已拒绝', '已放弃'
];

const DeliveryList: React.FC = () => {
  const navigate = useNavigate();
  const { deliveries, fetchDeliveries, createDelivery, updateDelivery, deleteDelivery, checkDuplicate, reorderDeliveries } = useDeliveryStore();
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, []);
  
  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingId !== null && draggingId !== id) {
      setDragOverId(id);
    }
  }, [draggingId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (draggingId !== null && draggingId !== dropId) {
      try {
        await reorderDeliveries(draggingId, dropId);
        message.success('排序已更新');
      } catch (error: any) {
        message.error('排序更新失败：' + (error?.message || '未知错误'));
      }
    }
    setDraggingId(null);
    setDragOverId(null);
  }, [draggingId, reorderDeliveries]);
  
  // 从所有投递记录中提取唯一的行业、岗位和地点名称列表
  const allIndustryNames = Array.from(new Set(deliveries.map(d => d.industryName).filter(Boolean))).sort();
  const allPositionTypeNames = Array.from(new Set(deliveries.map(d => d.positionTypeName).filter(Boolean))).sort();
  const allLocations = Array.from(new Set(deliveries.map(d => d.location).filter(Boolean))).sort();
  
  const filteredDeliveries = deliveries.filter(d => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      if (!d.companyName.toLowerCase().includes(kw) && 
          !d.positionName.toLowerCase().includes(kw)) {
        return false;
      }
    }
    if (statusFilter && d.status !== statusFilter) return false;
    if (industryFilter && d.industryName !== industryFilter) return false;
    if (positionFilter && d.positionTypeName !== positionFilter) return false;
    if (locationFilter && d.location !== locationFilter) return false;
    if (dateRange && d.deliveryDate) {
      if (d.deliveryDate < dateRange[0] || d.deliveryDate > dateRange[1]) return false;
    }
    return true;
  });
  
  const handleCreate = async (data: CreateDeliveryDTO) => {
    const duplicate = await checkDuplicate(data.companyName, data.positionName);
    if (duplicate) {
      message.warning('检测到重复投递：' + duplicate.companyName + ' - ' + duplicate.positionName);
    }
    await createDelivery(data);

    message.success('投递记录添加成功！');
    setAddModalVisible(false);
  };
  
  const handleStatusChange = async (id: string, status: DeliveryStatus) => {
    await updateDelivery(id, { status });
    message.success('状态已更新');
  };
  
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条投递记录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await deleteDelivery(id);
        message.success('删除成功');
      }
    });
  };
  
  const handleViewDetail = (delivery: Delivery) => {
    navigate(`/deliveries/${delivery.id}`);
  };
  
  const clearFilters = () => {
    setSearchKeyword('');
    setStatusFilter(null);
    setIndustryFilter(null);
    setPositionFilter(null);
    setLocationFilter(null);
    setDateRange(null);
  };
  
  const hasFilters = searchKeyword || statusFilter || industryFilter || positionFilter || locationFilter || dateRange;
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: 24, 
            fontWeight: 600,
            color: '#5D5348',
            fontFamily: 'Noto Serif SC, serif'
          }}>
            投递列表
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#9B9285' }}>管理和追踪所有投递记录</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
          style={{
            background: '#E07A5F',
            border: 'none',
            borderRadius: 8
          }}
        >
          添加投递
        </Button>
      </div>
      
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #E8E0D5',
          marginBottom: 16
        }}
        styles={{ body: { padding: 16 } }}
      >
        <Space wrap size="middle" style={{ width: '100%' }}>
          <Input
            placeholder="搜索公司/岗位..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 200, borderRadius: 8, background: 'transparent' }}
            allowClear
            variant="borderless"
          />
          
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            {DELIVERY_STATUSES.map(status => (
              <Select.Option key={status} value={status}>
                <StatusTag status={status} size="small" />
              </Select.Option>
            ))}
          </Select>
          
          <Select
            placeholder="行业筛选"
            value={industryFilter}
            onChange={setIndustryFilter}
            allowClear
            style={{ width: 140 }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {allIndustryNames.map(name => (
              <Select.Option key={name} value={name} label={name}>
                {name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="岗位筛选"
            value={positionFilter}
            onChange={setPositionFilter}
            allowClear
            style={{ width: 140 }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {allPositionTypeNames.map(name => (
              <Select.Option key={name} value={name} label={name}>
                {name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="地点筛选"
            value={locationFilter}
            onChange={setLocationFilter}
            allowClear
            style={{ width: 140 }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {allLocations.map(name => (
              <Select.Option key={name} value={name} label={name}>
                {name}
              </Select.Option>
            ))}
          </Select>
          
          <RangePicker 
            onChange={(dates, dateStrings) => {
              if (dates && dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
            }}
            style={{ borderRadius: 8 }}
          />
          
          {hasFilters && (
            <Button onClick={clearFilters} size="middle">
              清除筛选
            </Button>
          )}
        </Space>
      </Card>
      
      {filteredDeliveries.length > 0 ? (
        <>
          <div style={{
            marginBottom: 16,
            color: '#666',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>共 {filteredDeliveries.length} 条记录</span>
            <Tooltip title="拖拽卡片可调整排序">
              <span style={{ color: '#9B9285', fontSize: 12 }}>
                <DragOutlined style={{ marginRight: 4 }} />
                支持拖拽排序
              </span>
            </Tooltip>
          </div>
          <Row gutter={[16, 16]}>
            {filteredDeliveries.map((d) => (
              <Col
                key={d.id}
                xs={24} sm={12} lg={8} xl={6}
                draggable={!searchKeyword && !statusFilter && !industryFilter && !positionFilter && !locationFilter && !dateRange}
                onDragStart={() => handleDragStart(d.id)}
                onDragOver={(e) => handleDragOver(e, d.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, d.id)}
                style={{
                  opacity: draggingId === d.id ? 0.5 : 1,
                  transform: dragOverId === d.id ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: (!searchKeyword && !statusFilter && !industryFilter && !positionFilter && !locationFilter && !dateRange) ? 'move' : 'default'
                }}
              >
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'view',
                        label: '查看详情',
                        onClick: () => handleViewDetail(d)
                      },
                      {
                        key: 'delete',
                        label: '删除',
                        danger: true,
                        onClick: () => handleDelete(d.id)
                      }
                    ]
                  }}
                  trigger={['click']}
                >
                  <div>
                    <DeliveryCard
                      delivery={d}
                      onClick={() => handleViewDetail(d)}
                      onStatusChange={(status) => handleStatusChange(d.id, status)}
                    />
                  </div>
                </Dropdown>
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <Empty 
          description={hasFilters ? "没有符合条件的记录" : "还没有投递记录"} 
          style={{ marginTop: 80 }}
        >
          {!hasFilters && (
            <Button 
              type="primary" 
              onClick={() => setAddModalVisible(true)}
              style={{
                background: '#E07A5F',
                border: 'none',
                borderRadius: 8
              }}
            >
              添加第一条投递
            </Button>
          )}
        </Empty>
      )}
      
      <Modal
        title="添加投递记录"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <DeliveryForm
          onSubmit={handleCreate}
          onCancel={() => setAddModalVisible(false)}
        />
      </Modal>


    </div>
  );
};

export default DeliveryList;