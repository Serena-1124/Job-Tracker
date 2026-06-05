import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface QuickAddButtonProps {
  onClick: () => void;
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({ onClick }) => {
  return (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      size="large"
      onClick={onClick}
      style={{
        borderRadius: 24,
        height: 48,
        paddingLeft: 24,
        paddingRight: 24,
        background: '#E07A5F',
        border: 'none',
        boxShadow: '0 4px 12px rgba(224, 122, 95, 0.4)'
      }}
    >
      快速添加
    </Button>
  );
};

export default QuickAddButton;
