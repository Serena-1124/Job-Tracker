import React from 'react';
import { Tooltip } from 'antd';

interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  unlocked,
  unlockedAt
}) => {
  return (
    <Tooltip 
      title={
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12 }}>{description}</div>
          {unlockedAt && (
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
              解锁于 {new Date(unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      }
    >
      <div 
        className={`achievement-badge ${unlocked ? 'unlocked' : 'locked'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 8px',
          borderRadius: 12,
          background: unlocked ? '#F5F0E8' : '#F8F8F8',
          border: `2px solid ${unlocked ? '#D4C5B5' : '#E8E8E8'}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minWidth: 80,
          opacity: unlocked ? 1 : 0.5
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 4 }}>
          {unlocked ? icon : '🔒'}
        </div>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 500,
          color: unlocked ? '#5D5348' : '#9B9285',
          textAlign: 'center'
        }}>
          {title}
        </div>
      </div>
    </Tooltip>
  );
};

export default AchievementBadge;
