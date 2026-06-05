import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Delivery } from '../../types';

interface IndustryDistributionChartProps {
  deliveries: Delivery[];
}

const COLORS = ['#D4A574', '#B5A99A', '#A99B8B', '#8B7355', '#C4B8A8', '#D4C5B5', '#9B9285'];

const IndustryDistributionChart: React.FC<IndustryDistributionChartProps> = ({ deliveries }) => {
  const chartData = useMemo(() => {
    const industryCount: Record<string, number> = {};
    
    deliveries.forEach(d => {
      if (d.industryName) {
        industryCount[d.industryName] = (industryCount[d.industryName] || 0) + 1;
      }
    });
    
    return Object.entries(industryCount)
      .map(([name, count], index) => ({
        value: count,
        name: name,
        itemStyle: { color: COLORS[index % COLORS.length] },
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [deliveries]);

  const option = {
    animation: false,
    series: [{
      type: 'pie',
      radius: '75%',
      center: ['50%', '50%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#FDF8F3',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{b}\n{c}家',
        color: '#5D5348',
        fontSize: 11,
        fontFamily: 'Noto Serif SC',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 13,
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
        return `${params.name}<br/>${params.value} 家 (${params.percent}%)`;
      },
    },
  };

  return (
    <div style={{ height: 220 }}>
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
};

export default IndustryDistributionChart;