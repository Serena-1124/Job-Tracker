import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Button, message, Space } from 'antd';
import type { CreateInterviewNoteDTO, InterviewNote } from '../../types';
import dayjs from 'dayjs';

interface InterviewNoteFormProps {
  initialValues?: Partial<InterviewNote>;
  deliveries: { id: string; companyName: string; positionName: string }[];
  onSubmit: (data: CreateInterviewNoteDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const InterviewNoteForm: React.FC<InterviewNoteFormProps> = ({
  initialValues,
  deliveries,
  onSubmit,
  onCancel,
  loading
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const selectedDelivery = deliveries.find(d => d.id === values.deliveryId);

      const data: CreateInterviewNoteDTO = {
        deliveryId: values.deliveryId,
        companyName: selectedDelivery ? selectedDelivery.companyName : undefined,
        positionName: selectedDelivery ? selectedDelivery.positionName : undefined,
        title: values.title,
        content: values.content,
        interviewer: values.interviewer,
        interviewRound: values.interviewRound,
        interviewDate: values.interviewDate ? dayjs(values.interviewDate).format('YYYY-MM-DD') : undefined,
      };

      await onSubmit(data);
      if (!initialValues) {
        form.resetFields();
      }
    } catch (error: any) {
      message.error('操作失败: ' + (error?.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues ? {
        ...initialValues,
        interviewDate: initialValues.interviewDate ? dayjs(initialValues.interviewDate) : null
      } : undefined}
    >
      <Form.Item
        name="deliveryId"
        label="关联投递"
        rules={[{ required: true, message: '请选择关联的投递记录' }]}
      >
        <Select
          placeholder="选择关联的投递记录"
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={deliveries.map(d => ({
            value: d.id,
            label: `${d.companyName} - ${d.positionName}`
          }))}
        />
      </Form.Item>

      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input placeholder="输入面经标题，如：字节跳动一面面经" />
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item
          name="interviewRound"
          label="面试轮次"
        >
          <Select
            placeholder="选择面试轮次"
            allowClear
            options={[
              { value: '笔试', label: '笔试' },
              { value: '一面', label: '一面' },
              { value: '二面', label: '二面' },
              { value: '三面', label: '三面' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="interviewDate"
          label="面试日期"
        >
          <DatePicker style={{ width: '100%' }} placeholder="选择面试日期" />
        </Form.Item>
      </div>

      <Form.Item
        name="interviewer"
        label="面试官"
      >
        <Input placeholder="输入面试官的职位或姓名" />
      </Form.Item>

      <Form.Item
        name="content"
        label="面经内容"
        rules={[{ required: true, message: '请输入面经内容' }]}
      >
        <Input.TextArea
          rows={8}
          placeholder="记录面试过程、问题、感受等..."
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={submitting || loading}>
            {initialValues ? '保存' : '添加'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default InterviewNoteForm;