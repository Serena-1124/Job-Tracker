import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, message, Space, Divider, Upload, List, Typography } from 'antd';
import { PlusOutlined, LinkOutlined, FileOutlined } from '@ant-design/icons';
import type { CreateDeliveryDTO, Delivery, DeliveryStatus, Attachment } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DeliveryFormProps {
  initialValues?: Partial<Delivery>;
  onSubmit: (data: CreateDeliveryDTO) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DEFAULT_DELIVERY_METHODS = ['BOSS直聘', '实习僧', '官网', '邮箱'];

const getDeliveryMethods = (): { value: string; label: string }[] => {
  const savedMethods = localStorage.getItem('customDeliveryMethods');
  const customMethods: string[] = savedMethods ? JSON.parse(savedMethods) : [];
  const allMethods = [...DEFAULT_DELIVERY_METHODS.map(m => ({ value: m, label: m }))];
  
  customMethods.forEach((method: string) => {
    if (!allMethods.find(m => m.value === method)) {
      allMethods.push({ value: method, label: method });
    }
  });
  
  return allMethods;
};

const DELIVERY_STATUSES: DeliveryStatus[] = [
  '待投递', '仅沟通', '已投递', '通过初筛', '笔试', '一面', '二面', '三面', '已Offer', '未通过', '已接受', '已拒绝', '已放弃'
];

const DeliveryForm: React.FC<DeliveryFormProps> = ({ 
  initialValues, 
  onSubmit, 
  onCancel,
  loading 
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<{ value: string; label: string }[]>(getDeliveryMethods());

  const saveCustomDeliveryMethod = (method: string) => {
    const savedMethods = localStorage.getItem('customDeliveryMethods');
    const customMethods = savedMethods ? JSON.parse(savedMethods) : [];
    if (!customMethods.includes(method) && !DEFAULT_DELIVERY_METHODS.includes(method)) {
      customMethods.push(method);
      localStorage.setItem('customDeliveryMethods', JSON.stringify(customMethods));
      setDeliveryMethods(getDeliveryMethods());
    }
  };

  // 设置表单初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        deliveryDate: initialValues.deliveryDate ? dayjs(initialValues.deliveryDate) : null,
        interviewDate: initialValues.interviewDate ? dayjs(initialValues.interviewDate) : null
      });
      setLinks(initialValues.links || []);
      setFiles(initialValues.files || []);
    }
  }, [initialValues, form]);

  const handleAddLink = () => {
    if (linkInput && linkInput.trim()) {
      try {
        new URL(linkInput.trim());
      } catch {
        message.warning('请输入有效的URL地址');
        return;
      }
      setLinks([...links, linkInput.trim()]);
      setLinkInput('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      message.error('文件大小不能超过 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) return;
      const newFile: Attachment = {
        id: uuidv4(),
        name: file.name,
        url: result as string,
        size: file.size,
        type: file.type
      };
      setFiles([...files, newFile]);
    };
    reader.onerror = () => {
      message.error('文件读取失败');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const data: CreateDeliveryDTO = {
        companyName: values.companyName,
        positionName: values.positionName,
        deliveryMethod: values.deliveryMethod,
        deliveryDate: values.deliveryDate ? (dayjs.isDayjs(values.deliveryDate) ? values.deliveryDate.format('YYYY-MM-DD') : values.deliveryDate) : undefined,
        interviewDate: values.interviewDate ? (dayjs.isDayjs(values.interviewDate) ? values.interviewDate.format('YYYY-MM-DD HH:mm') : values.interviewDate) : (initialValues ? undefined : undefined),
        status: values.status,
        industryName: values.industryName,
        positionTypeName: values.positionTypeName,
        location: values.location,
        salary: values.salary,
        remark: values.remark,
        links: links,
        files: files
      };

      await onSubmit(data);
      if (!initialValues) {
        setLinks([]);
        setFiles([]);
        setLinkInput('');
        form.resetFields();
      }
    } catch (error: any) {
      console.error('提交失败:', error);
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
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item
          name="companyName"
          label="公司名称"
          rules={[{ required: true, message: '请输入公司名称' }]}
        >
          <Input placeholder="输入公司名称" />
        </Form.Item>
        
        <Form.Item
          name="positionName"
          label="岗位名称"
          rules={[{ required: true, message: '请输入岗位名称' }]}
        >
          <Input placeholder="输入岗位名称" />
        </Form.Item>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item 
          name="industryName" 
          label="行业分类"
        >
          <Input placeholder="输入行业分类，如：互联网、金融" />
        </Form.Item>
        
        <Form.Item 
          name="positionTypeName" 
          label="岗位分类"
        >
          <Input placeholder="输入岗位分类，如：前端、后端" />
        </Form.Item>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item
          name="deliveryMethod"
          label="投递方式"
          rules={[{ required: true, message: '请选择或输入投递方式' }]}
        >
          <Select
            placeholder="选择投递方式"
            options={deliveryMethods}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={(value) => {
              if (value && typeof value === 'string' && !deliveryMethods.find(m => m.value === value)) {
                saveCustomDeliveryMethod(value);
                message.success(`已保存投递方式：${value}`);
                setDeliveryMethods(getDeliveryMethods());
              }
            }}
          />
        </Form.Item>
        
        <Form.Item 
          name="status" 
          label="投递状态"
          rules={[{ required: true, message: '请选择投递状态' }]}
        >
          <Select 
            placeholder="选择状态"
            options={DELIVERY_STATUSES.map(s => ({ value: s, label: s }))}
          />
        </Form.Item>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item name="location" label="工作地点">
          <Input placeholder="输入工作地点，如：北京、上海" />
        </Form.Item>
        
        <Form.Item name="salary" label="薪资范围">
          <Input placeholder="输入薪资范围，如：15k-25k" />
        </Form.Item>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item name="deliveryDate" label="投递日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item 
          name="interviewDate" 
          label="面试时间"
          extra={
            <Text type="secondary" style={{ fontSize: 11, color: '#9B9285' }}>
              状态变更时，建议手动清空面试时间，以避免面试日历显示错误
            </Text>
          }
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            placeholder="选择面试日期和时间"
          />
        </Form.Item>
      </div>
      
      <Divider />
      
      <Form.Item label="相关链接">
        <Space>
          <Input 
            style={{ flex: 1, width: 'auto' }}
            placeholder="输入链接地址"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onPressEnter={handleAddLink}
          />
          <Button type="primary" onClick={handleAddLink} icon={<PlusOutlined />}>
            添加
          </Button>
        </Space>
        
        {links.length > 0 && (
          <List
            size="small"
            dataSource={links}
            style={{ marginTop: 8, maxHeight: 100, overflow: 'auto' }}
            renderItem={(link, index) => (
              <List.Item
                actions={[<Button type="link" danger size="small" onClick={() => handleRemoveLink(index)}>删除</Button>]}
              >
                <LinkOutlined style={{ marginRight: 8 }} />
                <Text ellipsis style={{ width: '70%' }}>{link}</Text>
              </List.Item>
            )}
          />
        )}
      </Form.Item>
      
      <Form.Item label="附件上传">
        <Upload
          beforeUpload={() => false}
          onChange={handleFileChange}
          fileList={[]}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        >
          <Button icon={<FileOutlined />}>选择文件</Button>
        </Upload>
        <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
          支持 PDF、图片格式，单个文件不超过 10MB
        </Text>
        
        {files.length > 0 && (
          <List
            size="small"
            dataSource={files}
            style={{ marginTop: 8, maxHeight: 120, overflow: 'auto' }}
            renderItem={(file) => (
              <List.Item
                actions={[<Button type="link" danger size="small" onClick={() => handleRemoveFile(file.id)}>删除</Button>]}
              >
                <Text ellipsis style={{ width: '70%' }}>{file.name}</Text>
              </List.Item>
            )}
          />
        )}
      </Form.Item>
      
      <Form.Item name="remark" label="备注" style={{ marginTop: 16 }}>
        <Input.TextArea rows={3} placeholder="添加备注信息" />
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

export default DeliveryForm;