import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Button, Modal, message, Empty, Badge, List, Typography, Select } from 'antd';
import { PlusOutlined, CalendarOutlined, CheckOutlined, FileTextOutlined, SendOutlined, QuestionCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useDeliveryStore } from '../stores/deliveryStore';
import DeliveryForm from '../components/delivery/DeliveryForm';

import type { Delivery, CreateDeliveryDTO } from '../types';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { deliveries, fetchDeliveries, fetchStats, createDelivery, quickApply } = useDeliveryStore();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const currentYear = currentMonth.year();
  const yearOptions = useMemo(() => {
    const years = [];
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    for (let y = startYear; y <= endYear; y++) {
      years.push({ value: y, label: `${y}年` });
    }
    return years;
  }, [currentYear]);
  
  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, []);

  const pendingDeliveries = useMemo(() => {
    return deliveries.filter(d => d.status === '待投递');
  }, [deliveries]);

  const displayedPending = useMemo(() => {
    return pendingDeliveries.slice(0, 2);
  }, [pendingDeliveries]);
  
  const appliedDeliveries = useMemo(() => {
    return deliveries.filter(d => d.status !== '待投递');
  }, [deliveries]);

  const displayedApplied = useMemo(() => {
    return appliedDeliveries.slice(0, 2);
  }, [appliedDeliveries]);
  
  const deliveriesWithInterview = useMemo(() => {
    const validInterviewStatuses = ['通过初筛', '笔试', '一面', '二面', '三面', '已Offer'];
    return deliveries.filter(d => d.interviewDate && validInterviewStatuses.includes(d.status));
  }, [deliveries]);
  
  const inProgressCount = useMemo(() => {
    return deliveries.filter(d =>
      ['通过初筛', '笔试', '一面', '二面', '三面'].includes(d.status)
    ).length;
  }, [deliveries]);

  const totalCount = useMemo(() => {
    return deliveries.filter(d => d.status !== '待投递').length;
  }, [deliveries]);

  const offerCount = useMemo(() => {
    return deliveries.filter(d => ['已Offer', '已接受', '已拒绝'].includes(d.status)).length;
  }, [deliveries]);
  
  const handleCreate = async (data: CreateDeliveryDTO) => {
    await createDelivery(data);
    setAddModalVisible(false);
    message.success('添加成功');
  };
  
  const handleQuickApply = async (id: string) => {
    await quickApply(id);
    message.success('已标记为已投递，投递日期已更新为今天');
  };
  
  const handleViewDetail = (delivery: Delivery) => {
    navigate(`/deliveries/${delivery.id}`);
  };
  
  const calendarData = useMemo(() => {
    const data: Record<string, Delivery[]> = {};
    deliveriesWithInterview.forEach(d => {
      if (d.interviewDate) {
        if (!data[d.interviewDate]) {
          data[d.interviewDate] = [];
        }
        data[d.interviewDate].push(d);
      }
    });
    return data;
  }, [deliveriesWithInterview]);
  
  const renderCalendar = () => {
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfMonth = currentMonth.startOf('month').day();
    const startDay = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
    
    const days = [];
    for (let i = 1; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentMonth.date(i).format('YYYY-MM-DD');
      const hasInterview = calendarData[date]?.length > 0;
      const isSelected = date === selectedDate;
      
      days.push(
        <div 
          key={date}
          className={`calendar-day ${isSelected ? 'selected' : ''}`}
          style={hasInterview ? {
            fontWeight: 600,
            color: '#D4A574',
          } : undefined}
          onClick={() => setSelectedDate(date)}
        >
          <span>{i}</span>
          {hasInterview && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A574', marginTop: 2 }} />}
        </div>
      );
    }
    
    return days;
  };
  
  const getCategoryName = (name: string) => {
    return name || '-';
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <Title level={2} style={{ margin: 0, color: '#5D5348', fontWeight: 500 }}>求职进度管理</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>让每一次投递都有迹可循</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
          className="add-btn"
        >
          添加投递
        </Button>
      </div>
      
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <div className="stat-value">{pendingDeliveries.length}</div>
              <div className="stat-label">
                待投递 <QuestionCircleOutlined className="help-icon" />
              </div>
            </Card>
            <div className="stat-tooltip">
              待投递 = 已收藏但尚未投递的岗位数量
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">
                总投递 <QuestionCircleOutlined className="help-icon" />
              </div>
            </Card>
            <div className="stat-tooltip">
              总投递 = 排除"待投递"状态的所有投递记录数量（包含仅沟通、已投递、通过初筛、笔试、一面、二面、三面、已Offer、未通过、已接受、已拒绝、已放弃）
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <div className="stat-value">{inProgressCount}</div>
              <div className="stat-label">
                推进中 <QuestionCircleOutlined className="help-icon" />
              </div>
            </Card>
            <div className="stat-tooltip">
              推进中 = 状态为"通过初筛"、"笔试"、"一面"、"二面"、"三面"的投递记录数量
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <div className="stat-value">{offerCount}</div>
              <div className="stat-label">
                获得Offer <QuestionCircleOutlined className="help-icon" />
              </div>
            </Card>
            <div className="stat-tooltip">
              获得Offer = 状态为"已Offer"、"已接受"、"已拒绝"的投递记录数量
            </div>
          </div>
        </Col>
      </Row>
      
      <div className="main-content">
        <div className="left-column">
          <Card 
            className="dashboard-card"
            title={
              <div className="card-title">
                <FileTextOutlined style={{ marginRight: 8, color: '#8B7355' }} />
                <span>待投递</span>
                <Badge count={pendingDeliveries.length} style={{ backgroundColor: '#D4C5B5', marginLeft: 8 }} />
              </div>
            }
          >
            {pendingDeliveries.length > 0 ? (
              <>
                <List
                  dataSource={displayedPending}
                  renderItem={(item) => (
                    <List.Item
                      className="pending-item clickable-row"
                      actions={[
                        <Button 
                          key="apply" 
                          type="link" 
                          icon={<CheckOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickApply(item.id);
                          }}
                          className="quick-apply-btn"
                        >
                          一键投递
                        </Button>
                      ]}
                      onClick={() => handleViewDetail(item)}
                    >
                      <List.Item.Meta
                        title={
                          <span style={{ color: '#5D5348', fontWeight: 500 }}>
                            {item.companyName}
                          </span>
                        }
                        description={
                          <span className="item-meta">
                            {item.positionName} · {getCategoryName(item.industryName)}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Text type="secondary" style={{ fontSize: 11, color: '#9B9285', display: 'block', textAlign: 'center', marginTop: 4 }}>
                  共 {pendingDeliveries.length} 个，展示前 2 个（按添加时间倒序）
                </Text>
              </>
            ) : (
              <Empty description="暂无待投递记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
          
          <Card
            className="dashboard-card"
            title={
              <div className="card-title">
                <SendOutlined style={{ marginRight: 8, color: '#6B5B4F' }} />
                <span>总投递</span>
                <Badge count={appliedDeliveries.length} style={{ backgroundColor: '#B5A99A', marginLeft: 8 }} />
              </div>
            }
          >
            {appliedDeliveries.length > 0 ? (
              <>
                <List
                  dataSource={displayedApplied}
                  renderItem={(item) => (
                    <List.Item
                      className="pending-item clickable-row"
                      onClick={() => handleViewDetail(item)}
                    >
                      <List.Item.Meta
                        title={
                          <span style={{ color: '#5D5348', fontWeight: 500 }}>
                            {item.companyName}
                          </span>
                        }
                        description={
                          <span className="item-meta">
                            {item.positionName} · {getCategoryName(item.industryName)}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Text type="secondary" style={{ fontSize: 11, color: '#9B9285', display: 'block', textAlign: 'center', marginTop: 4 }}>
                  共 {appliedDeliveries.length} 个，展示前 2 个（按添加时间倒序）
                </Text>
              </>
            ) : (
              <Empty description="暂无投递记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
        
        <Card
          className="dashboard-card calendar-card"
          title={
            <div className="card-title">
              <CalendarOutlined style={{ marginRight: 8 }} />
              <span>面试日历</span>
              <Badge count={deliveriesWithInterview.length} style={{ backgroundColor: '#D4C5B5', marginLeft: 8 }} />
            </div>
          }
          extra={
            <span style={{ color: '#9B9285', fontSize: 12 }}>
              {selectedDate ? dayjs(selectedDate).format('MM月DD日') : '点击日期查看面试'}
            </span>
          }
        >
          <div className="mini-calendar">
            <div className="calendar-header compact">
              <Button
                type="text"
                size="small"
                onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
              >
                ←
              </Button>
              <div className="calendar-title">
                <Select
                  size="small"
                  value={currentYear}
                  options={yearOptions}
                  onChange={(year) => setCurrentMonth(currentMonth.year(year))}
                  style={{ width: 80, marginRight: 4 }}
                  variant="borderless"
                  className="year-select"
                />
                <span>{currentMonth.format('M月')}</span>
              </div>
              <Button
                type="text"
                size="small"
                onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
              >
                →
              </Button>
            </div>
            <div className="calendar-weekdays">
              {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                <div key={d} className="weekday">{d}</div>
              ))}
            </div>
            <div className="calendar-days">
              {renderCalendar()}
            </div>
          </div>

          {/* 选中日期面试列表 */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F0EAE0' }}>
            <Text style={{ fontSize: 13, fontWeight: 500, color: '#5D5348', display: 'block', marginBottom: 8 }}>
              {selectedDate ? `${dayjs(selectedDate).format('MM月DD日')} 面试` : '今日面试'}
            </Text>
            {(() => {
              const dateStr = selectedDate || dayjs().format('YYYY-MM-DD');
              const dateInterviews = deliveriesWithInterview.filter(d => {
                if (!d.interviewDate) return false;
                return d.interviewDate.startsWith(dateStr);
              });
              if (dateInterviews.length === 0) {
                return <Text type="secondary" style={{ fontSize: 12 }}>无面试安排</Text>;
              }
              return (
                <List
                  size="small"
                  dataSource={dateInterviews}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0', borderBottom: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <ClockCircleOutlined style={{ color: '#D4A574' }} />
                        <span style={{ color: '#5D5348', fontWeight: 500 }}>{item.interviewDate?.slice(11, 16) || '--:--'}</span>
                        <span style={{ color: '#8B7355' }}>{item.companyName}</span>
                        <span style={{ color: '#9B9285' }}>{item.positionName}</span>
                      </div>
                    </List.Item>
                  )}
                />
              );
            })()}
          </div>
        </Card>
      </div>
      
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

export default Dashboard;
