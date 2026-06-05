import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, DatePicker, List, Checkbox, Badge, Empty, message, Tabs, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined, FlagOutlined, EditOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useTodoStore } from '../stores/todoStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import type { TodoItem, CreateTodoDTO, UpdateTodoDTO } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

const PRIORITY_CONFIG = {
  high: { label: '高', color: '#E07A5F', icon: <FlagOutlined /> },
  medium: { label: '中', color: '#D4A574', icon: <FlagOutlined /> },
  low: { label: '低', color: '#9B9285', icon: <FlagOutlined /> }
};

const TodoList: React.FC = () => {
  const { todos, fetchTodos, createTodo, updateTodo, deleteTodo, toggleComplete, moveUp, moveDown } = useTodoStore();
  const { deliveries, fetchDeliveries } = useDeliveryStore();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTodo, setCurrentTodo] = useState<TodoItem | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTodos();
    fetchDeliveries();
  }, []);

  // 创建待办
  const handleCreate = async (values: any) => {
    const delivery = values.deliveryId ? deliveries.find(d => d.id === values.deliveryId) : null;

    const data: CreateTodoDTO = {
      deliveryId: delivery?.id,
      companyName: delivery?.companyName,
      positionName: delivery?.positionName,
      content: values.content,
      dueDate: values.dueDate?.format('YYYY-MM-DD'),
      priority: values.priority || 'medium'
    };

    await createTodo(data);
    setAddModalVisible(false);
    addForm.resetFields();
    message.success('待办事项已创建');
  };

  // 编辑待办
  const handleEdit = (todo: TodoItem) => {
    setCurrentTodo(todo);
    editForm.setFieldsValue({
      content: todo.content,
      priority: todo.priority,
      dueDate: todo.dueDate ? dayjs(todo.dueDate) : null
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!currentTodo) return;

    const data: UpdateTodoDTO = {
      content: values.content,
      priority: values.priority,
      dueDate: values.dueDate?.format('YYYY-MM-DD') || undefined
    };

    await updateTodo(currentTodo.id, data);
    setEditModalVisible(false);
    setCurrentTodo(null);
    editForm.resetFields();
    message.success('待办事项已更新');
  };

  const handleToggle = async (id: string) => {
    await toggleComplete(id);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条待办事项吗？',
      onOk: async () => {
        await deleteTodo(id);
        message.success('删除成功');
      }
    });
  };

  const filteredTodos = todos.filter(t => {
    if (activeTab === 'pending') return !t.completed;
    if (activeTab === 'completed') return t.completed;
    return true;
  });

  const groupedTodos = filteredTodos.reduce((acc, todo) => {
    const key = todo.companyName && todo.positionName
      ? `${todo.companyName} - ${todo.positionName}`
      : '未关联投递';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(todo);
    return acc;
  }, {} as Record<string, TodoItem[]>);

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: '#5D5348',
            fontFamily: 'Noto Serif SC, serif'
          }}>
            待办事项
            <Badge
              count={todos.filter(t => !t.completed).length}
              style={{ backgroundColor: '#E07A5F', marginLeft: 12 }}
            />
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#9B9285' }}>管理与投递相关的待办任务</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
          style={{
            background: '#E07A5F',
            border: 'none',
            borderRadius: 8
          }}
        >
          添加待办
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
        <TabPane tab={`全部 (${todos.length})`} key="all" />
        <TabPane tab={`待完成 (${todos.filter(t => !t.completed).length})`} key="pending" />
        <TabPane tab={`已完成 (${todos.filter(t => t.completed).length})`} key="completed" />
      </Tabs>

      {Object.keys(groupedTodos).length > 0 ? (
        Object.entries(groupedTodos).map(([groupKey, groupTodos]) => (
          <Card
            key={groupKey}
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: '1px solid #E8E0D5'
            }}
            title={
              <span style={{ fontWeight: 600, color: '#5D5348' }}>
                {groupKey}
              </span>
            }
          >
            <List
              dataSource={groupTodos}
              renderItem={(todo, index) => (
                <List.Item
                  actions={[
                    <Button
                      key="up"
                      type="text"
                      size="small"
                      icon={<UpOutlined />}
                      disabled={index === 0}
                      onClick={() => moveUp(todo.id)}
                      style={{ color: index === 0 ? '#ccc' : '#9B9285' }}
                    />,
                    <Button
                      key="down"
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled={index === groupTodos.length - 1}
                      onClick={() => moveDown(todo.id)}
                      style={{ color: index === groupTodos.length - 1 ? '#ccc' : '#9B9285' }}
                    />,
                    <Button
                      key="toggle"
                      type="text"
                      icon={todo.completed ? <CheckOutlined style={{ color: '#6B8B6B' }} /> : <CheckOutlined />}
                      onClick={() => handleToggle(todo.id)}
                    />,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined style={{ color: '#D4A574' }} />}
                      onClick={() => handleEdit(todo)}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(todo.id)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => handleToggle(todo.id)}
                        />
                        <span
                          style={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? '#999' : '#3D405B'
                          }}
                        >
                          {todo.content}
                        </span>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Tag
                          color={PRIORITY_CONFIG[todo.priority].color}
                          style={{ fontSize: 11 }}
                        >
                          {PRIORITY_CONFIG[todo.priority].label}优先级
                        </Tag>
                        {todo.dueDate && (
                          <span style={{
                            fontSize: 12,
                            color: isOverdue(todo.dueDate) ? '#E07A5F' : '#999'
                          }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {isOverdue(todo.dueDate) ? '已逾期: ' : '截止: '}
                            {dayjs(todo.dueDate).format('MM月DD日')}
                          </span>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        ))
      ) : (
        <Empty
          description="暂无待办事项"
          style={{ marginTop: 80 }}
        >
          <Button
            type="primary"
            onClick={() => setAddModalVisible(true)}
            style={{
              background: '#E07A5F',
              border: 'none',
              borderRadius: 8
            }}
          >
            添加第一条待办
          </Button>
        </Empty>
      )}

      {/* 添加待办弹窗 */}
      <Modal
        title="添加待办事项"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="deliveryId"
            label="关联投递（可选）"
          >
            <Select
              placeholder="选择公司-岗位（可选）"
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {deliveries.map(d => (
                <Select.Option
                  key={d.id}
                  value={d.id}
                  label={`${d.companyName} - ${d.positionName}`}
                >
                  {d.companyName} - {d.positionName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="待办内容"
            rules={[{ required: true, message: '请输入待办内容' }]}
          >
            <TextArea
              placeholder="例如：准备面试问题、完善简历..."
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            initialValue="medium"
          >
            <Select>
              <Select.Option value="high">
                <Tag color="#E07A5F">高优先级</Tag>
              </Select.Option>
              <Select.Option value="medium">
                <Tag color="#D4A574">中优先级</Tag>
              </Select.Option>
              <Select.Option value="low">
                <Tag color="#9B9285">低优先级</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择截止日期（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑待办弹窗 */}
      <Modal
        title="编辑待办事项"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentTodo(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="content"
            label="待办内容"
            rules={[{ required: true, message: '请输入待办内容' }]}
          >
            <TextArea
              placeholder="例如：准备面试问题、完善简历..."
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select>
              <Select.Option value="high">
                <Tag color="#E07A5F">高优先级</Tag>
              </Select.Option>
              <Select.Option value="medium">
                <Tag color="#D4A574">中优先级</Tag>
              </Select.Option>
              <Select.Option value="low">
                <Tag color="#9B9285">低优先级</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择截止日期（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodoList;
