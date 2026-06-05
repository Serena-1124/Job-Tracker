import React, { useState } from 'react';
import { Card, Button, Popconfirm } from 'antd';
import { StepForwardOutlined, CheckCircleOutlined, CloseCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import type { Delivery, DeliveryStatus } from '../../types';
import { getNextStatuses } from '../../types';
import StatusTag from '../common/StatusTag';

interface DeliveryCardProps {
  delivery: Delivery;
  onClick: () => void;
  onStatusChange?: (status: DeliveryStatus) => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onClick, onStatusChange }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const next = getNextStatuses(delivery.status);

  return (
    <Card
      hoverable
      onClick={onClick}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      style={{
        borderRadius: 12,
        border: '1px solid #E8E0D5',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      styles={{
        body: { padding: 16 }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#3D405B',
            marginBottom: 4
          }}>
            {delivery.companyName}
          </h3>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#666',
            fontWeight: 500
          }}>
            {delivery.positionName}
          </p>
        </div>
        <StatusTag status={delivery.status} size="small" />
      </div>

      {/* 行业+岗位组合标签 */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {delivery.industryName && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid #B5A99A40',
              fontSize: 12,
            }}
          >
            <span
              style={{
                background: '#B5A99A25',
                color: '#8B7355',
                padding: '2px 8px',
                fontWeight: 500,
              }}
            >
              {delivery.industryName}
            </span>
          </span>
        )}
        {delivery.positionTypeName && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid #9B928540',
              fontSize: 12,
            }}
          >
            <span
              style={{
                background: '#9B928515',
                color: '#9B9285',
                padding: '2px 8px',
                fontWeight: 500,
              }}
            >
              {delivery.positionTypeName}
            </span>
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#999'
      }}>
        <span>
          {delivery.location && <span style={{ marginRight: 8 }}>{delivery.location}</span>}
          {delivery.salary && <span style={{ color: '#B5A99A' }}>{delivery.salary}</span>}
          {!delivery.location && !delivery.salary && `投递：${delivery.deliveryDate}`}
        </span>
        {delivery.tags?.length > 0 && (
          <span style={{
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {delivery.tags[0]}
          </span>
        )}
      </div>

      {delivery.remark && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#F8F5F0',
          borderRadius: 6,
          fontSize: 12,
          color: '#8B7355',
          lineHeight: '1.5',
          wordBreak: 'break-all'
        }}>
          {delivery.remark}
        </div>
      )}

      {/* 快速操作按钮 */}
      {onStatusChange && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #F0EDE8',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            opacity: showQuickActions ? 1 : 0,
            transition: 'opacity 0.2s ease',
            minHeight: showQuickActions ? 'auto' : 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {next.advance && (
            <Button
              type="primary"
              size="small"
              icon={<StepForwardOutlined />}
              onClick={() => onStatusChange(next.advance!)}
              style={{
                background: '#E07A5F',
                borderColor: '#E07A5F',
                fontSize: 12,
                borderRadius: 6
              }}
            >
              推进到{next.advance}
            </Button>
          )}
          {next.accept && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange(next.accept!)}
              style={{
                background: '#6B8B6B',
                borderColor: '#6B8B6B',
                fontSize: 12,
                borderRadius: 6
              }}
            >
              接受Offer
            </Button>
          )}
          {next.reject && (
            <Popconfirm
              title={`确认标记为${next.reject}？`}
              onConfirm={() => onStatusChange(next.reject!)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                style={{
                  fontSize: 12,
                  borderRadius: 6
                }}
              >
                {next.reject === '已拒绝' ? '拒绝Offer' : '未通过'}
              </Button>
            </Popconfirm>
          )}
          {next.abandon && (
            <Popconfirm
              title="确认放弃该投递？"
              onConfirm={() => onStatusChange(next.abandon!)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                size="small"
                icon={<PauseCircleOutlined />}
                style={{
                  fontSize: 12,
                  borderRadius: 6,
                  color: '#A99B8B',
                  borderColor: '#D4C5B5'
                }}
              >
                放弃
              </Button>
            </Popconfirm>
          )}
        </div>
      )}
    </Card>
  );
};

export default DeliveryCard;