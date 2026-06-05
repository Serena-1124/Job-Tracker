import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Delivery, DeliveryStatus } from '../../types';

interface DeliveryProgressChartProps {
  deliveries: Delivery[];
}

const DeliveryProgressChart: React.FC<DeliveryProgressChartProps> = ({ deliveries }) => {
  // 每个具体状态的统计
  const detailStatusCount = useMemo(() => {
    const count: Record<string, number> = {};
    deliveries.forEach(d => {
      count[d.status] = (count[d.status] || 0) + 1;
    });
    return count;
  }, [deliveries]);

  // 推进中分类下的具体状态
  const inProgressStatuses: DeliveryStatus[] = ['通过初筛', '笔试', '一面', '二面', '三面'];
  // 已结束分类下的具体状态
  const endedStatuses: DeliveryStatus[] = ['未通过', '已放弃', '已接受', '已拒绝'];

  const chartData = useMemo(() => {
    const statusCount = {
      '待投递': 0,
      '仅沟通': 0,
      '已投递': 0,
      '推进中': 0,
      '已Offer': 0,
      '已结束': 0,
    };

    deliveries.forEach(d => {
      switch (d.status) {
        case '待投递':
          statusCount['待投递']++;
          break;
        case '仅沟通':
          statusCount['仅沟通']++;
          break;
        case '已投递':
          statusCount['已投递']++;
          break;
        case '通过初筛':
        case '笔试':
        case '一面':
        case '二面':
        case '三面':
          statusCount['推进中']++;
          break;
        case '已Offer':
          statusCount['已Offer']++;
          break;
        default:
          statusCount['已结束']++;
      }
    });

    return [
      { value: statusCount['待投递'], name: '待投递', itemStyle: { color: '#D4C5B5' } },
      { value: statusCount['仅沟通'], name: '仅沟通', itemStyle: { color: '#B5A99A' } },
      { value: statusCount['已投递'], name: '已投递', itemStyle: { color: '#A99B8B' } },
      { value: statusCount['推进中'], name: '推进中', itemStyle: { color: '#D4A574' } },
      { value: statusCount['已Offer'], name: '已Offer', itemStyle: { color: '#8B7355' } },
      { value: statusCount['已结束'], name: '已结束', itemStyle: { color: '#C4B8A8' } },
    ].filter(item => item.value > 0);
  }, [deliveries]);

  const option = {
    animation: false,
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#FDF8F3',
        borderWidth: 3,
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{c}家',
        color: '#5D5348',
        fontSize: 11,
        fontFamily: 'Noto Serif SC',
      },
      labelLine: {
        show: true,
        lineStyle: { color: '#D4C5B5' },
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
      data: chartData,
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: '#FDF8F3',
      borderColor: '#D4C5B5',
      textStyle: { color: '#5D5348', fontFamily: 'Noto Serif SC' },
      formatter: (params: any) => {
        const total = deliveries.length;
        let detailHtml = '';

        if (params.name === '推进中') {
          const subTotal = inProgressStatuses.reduce((sum, s) => sum + (detailStatusCount[s] || 0), 0);
          detailHtml = inProgressStatuses
            .filter(s => detailStatusCount[s])
            .map(s => {
              const count = detailStatusCount[s];
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              return `&nbsp;&nbsp;${s}: ${count}家 (${pct}%)`;
            })
            .join('<br/>');
          if (detailHtml) {
            detailHtml = `<br/>${detailHtml}<br/><b>小计: ${subTotal}家</b>`;
          }
        } else if (params.name === '已结束') {
          const subTotal = endedStatuses.reduce((sum, s) => sum + (detailStatusCount[s] || 0), 0);
          detailHtml = endedStatuses
            .filter(s => detailStatusCount[s])
            .map(s => {
              const count = detailStatusCount[s];
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              return `&nbsp;&nbsp;${s}: ${count}家 (${pct}%)`;
            })
            .join('<br/>');
          if (detailHtml) {
            detailHtml = `<br/>${detailHtml}<br/><b>小计: ${subTotal}家</b>`;
          }
        }

        return `<b>${params.name}</b><br/>${params.value} 家 (${params.percent}%)${detailHtml}`;
      },
    },
  };

  return (
    <div style={{ height: 220 }}>
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
};

export default DeliveryProgressChart;
