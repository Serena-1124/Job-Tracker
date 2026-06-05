import React, { useEffect, useState, useMemo } from 'react';
import { Card, Typography, Row, Col, Statistic, Select } from 'antd';
import { BarChartOutlined, RiseOutlined, PieChartOutlined, GlobalOutlined, QuestionCircleOutlined, SolutionOutlined } from '@ant-design/icons';
import { useDeliveryStore } from '../stores/deliveryStore';
import DeliveryTrendChart from '../components/charts/DeliveryTrendChart';
import DeliveryProgressChart from '../components/charts/InterviewProgressChart';
import IndustryDistributionChart from '../components/charts/IndustryDistributionChart';
import PositionDistributionChart from '../components/charts/PositionDistributionChart';
import dayjs from 'dayjs';

const { Text } = Typography;

const Analytics: React.FC = () => {
  const { deliveries, fetchDeliveries } = useDeliveryStore();
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const stats = useMemo(() => {
    // 总投递 = 排除"待投递"的所有状态
    const total = deliveries.filter(d => d.status !== '待投递').length;

    // 推进中 = 通过初筛、笔试、一面、二面、三面
    const inProgress = deliveries.filter(d =>
      ['通过初筛', '笔试', '一面', '二面', '三面'].includes(d.status)
    ).length;

    // 笔面试转化率分子：
    // （笔试 + 一面 + 二面 + 三面 + 已Offer + 已接受 + 已拒绝
    //  + 曾经从笔面试环节流转到未通过/已放弃）的数量
    const currentInterviewStatuses = ['笔试', '一面', '二面', '三面', '已Offer', '已接受', '已拒绝'];
    const currentInInterview = deliveries.filter(d => currentInterviewStatuses.includes(d.status)).length;

    // 曾经从笔面试环节（笔试/一面/二面/三面）流转到未通过/已放弃的数量
    const interviewPhases = ['笔试', '一面', '二面', '三面'];
    const endStatuses = ['未通过', '已放弃'];
    let fromInterviewToEnd = 0;
    deliveries.forEach(d => {
      if (d.timeline && d.timeline.length > 0) {
        const hasInterviewToEnd = d.timeline.some(entry =>
          interviewPhases.includes(entry.from as string) && endStatuses.includes(entry.to)
        );
        if (hasInterviewToEnd) {
          fromInterviewToEnd++;
        }
      }
    });

    const totalEnteredInterview = currentInInterview + fromInterviewToEnd;

    // 获得Offer = 已Offer、已接受、已拒绝（都拿到了Offer）
    const offer = deliveries.filter(d => ['已Offer', '已接受', '已拒绝'].includes(d.status)).length;
    const rejected = deliveries.filter(d => ['未通过', '已放弃'].includes(d.status)).length;

    // 笔面试转化率 = 所有进入过笔面试环节的数量 ÷ 总投递数量 × 100%
    const conversionRate = total > 0 ? Math.round((totalEnteredInterview / total) * 100) : 0;
    // Offer率 = 获得Offer ÷ 总投递 × 100%
    const offerRate = total > 0 ? Math.round((offer / total) * 100) : 0;

    // 本周投递 = 本周一00:00至当前时间，排除"待投递"
    const thisMonday = dayjs().startOf('week').startOf('day');
    const now = dayjs();
    const thisWeekCount = deliveries.filter(d => {
      if (d.status === '待投递') return false;
      const date = dayjs(d.deliveryDate || d.createdAt);
      return date.isAfter(thisMonday) && date.isBefore(now);
    }).length;

    return { total, inProgress, offer, rejected, conversionRate, offerRate, totalEnteredInterview, thisWeekCount };
  }, [deliveries]);

  const weeklyData = useMemo(() => {
    const weeks: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = dayjs().subtract(i, 'week').startOf('week').add(1, 'day').startOf('day');
      const weekEnd = weekStart.add(6, 'day').endOf('day');
      const count = deliveries.filter(d => {
        if (d.status === '待投递') return false;
        const date = dayjs(d.deliveryDate || d.createdAt);
        return date.isAfter(weekStart) && date.isBefore(weekEnd);
      }).length;
      weeks.push({
        week: `${weekStart.format('MM/DD')}-${weekEnd.format('MM/DD')}`,
        count
      });
    }
    return weeks;
  }, [deliveries]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#5D5348', fontFamily: 'Noto Serif SC, serif' }}>数据分析</h1>
          <Text type="secondary" style={{ fontSize: 14 }}>
            深入了解你的求职进度和趋势
          </Text>
        </div>
      </div>

      {/* 核心指标 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <Statistic
                title={
                  <span>
                    总投递 <QuestionCircleOutlined className="help-icon" />
                  </span>
                }
                value={stats.total}
                valueStyle={{ color: '#5D5348', fontSize: 28 }}
              />
            </Card>
            <div className="stat-tooltip">
              总投递 = 排除"待投递"状态的所有投递记录数量（包含仅沟通、已投递、通过初筛、笔试、一面、二面、三面、已Offer、未通过、已接受、已拒绝、已放弃）
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <Statistic
                title={
                  <span>
                    笔面试转化率 <QuestionCircleOutlined className="help-icon" />
                  </span>
                }
                value={stats.conversionRate}
                suffix="%"
                valueStyle={{ color: '#D4A574', fontSize: 28 }}
              />
            </Card>
            <div className="stat-tooltip">
              笔面试转化率 =（笔试 + 一面 + 二面 + 三面 + 已Offer + 已接受 + 已拒绝 + 曾经从笔面试环节流转到未通过/已放弃）÷ 总投递数量 × 100%
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <Statistic
                title={
                  <span>
                    Offer率 <QuestionCircleOutlined className="help-icon" />
                  </span>
                }
                value={stats.offerRate}
                suffix="%"
                valueStyle={{ color: '#8B7355', fontSize: 28 }}
              />
            </Card>
            <div className="stat-tooltip">
              Offer率 = 获得Offer（已Offer、已接受、已拒绝）的数量 ÷ 总投递数量 × 100%
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card-wrapper">
            <Card className="stat-card">
              <Statistic
                title={
                  <span>
                    本周投递 <QuestionCircleOutlined className="help-icon" />
                  </span>
                }
                value={stats.thisWeekCount}
                valueStyle={{ color: '#6B8B6B', fontSize: 28 }}
              />
            </Card>
            <div className="stat-tooltip">
              本周投递 = 本周一00:00至当前时间，状态不为"待投递"的投递记录数量
            </div>
          </div>
        </Col>
      </Row>

      {/* 投递趋势 */}
      <Card 
        className="dashboard-card"
        title={
          <div className="card-title">
            <RiseOutlined style={{ marginRight: 8, color: '#D4A574' }} />
            <span>投递趋势</span>
          </div>
        }
        extra={
          <Select
            value={trendDays}
            onChange={setTrendDays}
            options={[
              { value: 7, label: '近7天' },
              { value: 30, label: '近30天' },
            ]}
            size="small"
            style={{ width: 100 }}
          />
        }
        style={{ marginBottom: 16 }}
      >
        <DeliveryTrendChart deliveries={deliveries} days={trendDays} />
      </Card>

      {/* 面试进度、行业分布和岗位分布 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            className="dashboard-card"
            title={
              <div className="card-title">
                <PieChartOutlined style={{ marginRight: 8, color: '#D4A574' }} />
                <span>投递进度分布</span>
              </div>
            }
          >
            <DeliveryProgressChart deliveries={deliveries} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            className="dashboard-card"
            title={
              <div className="card-title">
                <GlobalOutlined style={{ marginRight: 8, color: '#D4A574' }} />
                <span>行业分布</span>
              </div>
            }
          >
            <IndustryDistributionChart deliveries={deliveries} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            className="dashboard-card"
            title={
              <div className="card-title">
                <SolutionOutlined style={{ marginRight: 8, color: '#D4A574' }} />
                <span>岗位分布</span>
              </div>
            }
          >
            <PositionDistributionChart deliveries={deliveries} />
          </Card>
        </Col>
      </Row>

      {/* 周投递统计 */}
      <Card 
        className="dashboard-card"
        title={
          <div className="card-title">
            <BarChartOutlined style={{ marginRight: 8, color: '#D4A574' }} />
            <span>近4周投递统计</span>
          </div>
        }
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {weeklyData.map((week, index) => (
            <Col xs={6} key={index}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Text style={{ fontSize: 12, color: '#9B9285', display: 'block', marginBottom: 8 }}>
                  {week.week}
                </Text>
                <Text style={{ fontSize: 28, fontWeight: 600, color: '#5D5348' }}>
                  {week.count}
                </Text>
                <Text style={{ fontSize: 12, color: '#9B9285', display: 'block', marginTop: 4 }}>
                  家
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Analytics;
