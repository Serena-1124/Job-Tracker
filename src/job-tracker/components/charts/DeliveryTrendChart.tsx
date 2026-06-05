import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { Delivery } from '../../types';

interface DeliveryTrendChartProps {
  deliveries: Delivery[];
  days?: number;
}

const DeliveryTrendChart: React.FC<DeliveryTrendChartProps> = ({ deliveries, days = 7 }) => {
  const chartData = useMemo(() => {
    const dates: string[] = [];
    const counts: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD');
      dates.push(date);
      
      const count = deliveries.filter(d => {
        if (d.status === '待投递') return false;
        const deliveryDate = d.deliveryDate || d.createdAt.split('T')[0];
        return dayjs(deliveryDate).format('MM-DD') === date;
      }).length;
      
      counts.push(count);
    }
    
    return { dates, counts };
  }, [deliveries, days]);

  const option = {
    animation: false,
    grid: {
      top: 30,
      right: 20,
      bottom: 30,
      left: 40,
    },
    xAxis: {
      type: 'category',
      data: chartData.dates,
      axisLine: { lineStyle: { color: '#D4C5B5' } },
      axisLabel: { color: '#9B9285', fontSize: 11, fontFamily: 'Noto Serif SC' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F5F0E8' } },
      axisLabel: { color: '#9B9285', fontSize: 11, fontFamily: 'Noto Serif SC' },
    },
    series: [{
      data: chartData.counts,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: '#D4A574',
        width: 3,
      },
      itemStyle: {
        color: '#D4A574',
        borderWidth: 2,
        borderColor: '#fff',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(212, 165, 116, 0.3)' },
            { offset: 1, color: 'rgba(212, 165, 116, 0.05)' },
          ],
        },
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FDF8F3',
      borderColor: '#D4C5B5',
      textStyle: { color: '#5D5348', fontFamily: 'Noto Serif SC' },
      formatter: (params: any) => {
        return `${params[0].axisValue}<br/>投递: ${params[0].value} 家`;
      },
    },
  };

  return (
    <div style={{ height: 200 }}>
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
};

export default DeliveryTrendChart;
