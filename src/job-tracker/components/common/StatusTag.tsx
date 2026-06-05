import React from 'react';
import { Tag } from 'antd';
import type { DeliveryStatus } from '../../types';
import { STATUS_COLORS } from '../../types';

interface StatusTagProps {
  status: DeliveryStatus;
  size?: 'small' | 'default';
}

const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'default' }) => {
  const config = STATUS_COLORS[status] || { color: '#3D405B', bgColor: '#E8E4F0' };
  
  return (
    <Tag 
      style={{ 
        color: config.color,
        backgroundColor: config.bgColor,
        border: 'none',
        fontSize: size === 'small' ? 12 : 14,
        padding: size === 'small' ? '0 6px' : '2px 10px',
        borderRadius: 4,
        fontWeight: 500
      }}
    >
      {status}
    </Tag>
  );
};

export default StatusTag;
