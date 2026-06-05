import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Modal, Empty, message, List, Typography, Tag, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, BookOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useInterviewNoteStore } from '../stores/interviewNoteStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import InterviewNoteForm from '../components/interview-note/InterviewNoteForm';
import type { InterviewNote, CreateInterviewNoteDTO } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

const InterviewNoteList: React.FC = () => {
  const { notes, fetchNotes, createNote, updateNote, deleteNote, moveUp, moveDown, searchNotes } = useInterviewNoteStore();
  const { deliveries, fetchDeliveries } = useDeliveryStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<InterviewNote | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchDeliveries();
  }, []);

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    if (value) {
      searchNotes(value);
    } else {
      fetchNotes();
    }
  };

  const handleCreate = async (data: CreateInterviewNoteDTO) => {
    await createNote(data);
    message.success('面经记录添加成功');
    setAddModalVisible(false);
  };

  const handleUpdate = async (data: CreateInterviewNoteDTO) => {
    if (!currentNote) return;
    await updateNote(currentNote.id, data);
    message.success('面经记录更新成功');
    setEditModalVisible(false);
    setCurrentNote(null);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    message.success('删除成功');
  };

  const openEditModal = (note: InterviewNote) => {
    setCurrentNote(note);
    setEditModalVisible(true);
  };

  const openViewModal = (note: InterviewNote) => {
    setCurrentNote(note);
    setViewModalVisible(true);
  };

  const deliveryOptions = deliveries.map(d => ({
    id: d.id,
    companyName: d.companyName,
    positionName: d.positionName
  }));

  // 按岗位分组
  const groupedNotes = notes.reduce((acc, note) => {
    const key = `${note.companyName || '未知公司'} - ${note.positionName || '未知岗位'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(note);
    return acc;
  }, {} as Record<string, InterviewNote[]>);

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
            面经记录
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#9B9285' }}>记录和回顾面试经验</p>
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
          添加面经
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #E8E0D5',
          marginBottom: 16
        }}
        styles={{ body: { padding: 16 } }}
      >
        <Input
          placeholder="搜索标题、内容、公司..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={searchKeyword}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: 300, borderRadius: 8 }}
          allowClear
        />
      </Card>



      {Object.keys(groupedNotes).length > 0 ? (
        Object.entries(groupedNotes).map(([groupKey, groupNotes]) => (
          <Card
            key={groupKey}
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: '1px solid #E8E0D5'
            }}
            title={
              <span style={{ fontWeight: 600, color: '#5D5348' }}>
                <BookOutlined style={{ marginRight: 8, color: '#8B7355' }} />
                {groupKey}
              </span>
            }
          >
            <List
              dataSource={groupNotes}
              renderItem={(note, index) => (
                <List.Item
                  actions={[
                    <Button
                      key="up"
                      type="text"
                      size="small"
                      icon={<UpOutlined />}
                      disabled={index === 0}
                      onClick={() => moveUp(note.id)}
                      style={{ color: index === 0 ? '#ccc' : '#9B9285' }}
                    />,
                    <Button
                      key="down"
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled={index === groupNotes.length - 1}
                      onClick={() => moveDown(note.id)}
                      style={{ color: index === groupNotes.length - 1 ? '#ccc' : '#9B9285' }}
                    />,
                    <Button
                      key="view"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => openViewModal(note)}
                    />,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(note)}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确认删除"
                      description="确定要删除这条面经记录吗？"
                      onConfirm={() => handleDelete(note.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#3D405B', fontWeight: 500 }}>
                          {note.title}
                        </span>
                        {note.interviewRound && (
                          <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none', fontSize: 11 }}>
                            {note.interviewRound}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                          {note.interviewer && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              面试官：{note.interviewer}
                            </Text>
                          )}
                          {note.interviewDate && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {note.interviewDate}
                            </Text>
                          )}
                        </div>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5
                          }}
                        >
                          {note.content}
                        </Text>
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
          description={searchKeyword ? "没有符合条件的面经记录" : "还没有面经记录"}
          style={{ marginTop: 80 }}
        >
          {!searchKeyword && (
            <Button
              type="primary"
              onClick={() => setAddModalVisible(true)}
              style={{
                background: '#E07A5F',
                border: 'none',
                borderRadius: 8
              }}
            >
              添加第一条面经
            </Button>
          )}
        </Empty>
      )}

      {/* 添加弹窗 */}
      <Modal
        title="添加面经记录"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <InterviewNoteForm
          deliveries={deliveryOptions}
          onSubmit={handleCreate}
          onCancel={() => setAddModalVisible(false)}
        />
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑面经记录"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setCurrentNote(null); }}
        footer={null}
        width={680}
        destroyOnHidden
      >
        {currentNote && (
          <InterviewNoteForm
            initialValues={currentNote}
            deliveries={deliveryOptions}
            onSubmit={handleUpdate}
            onCancel={() => { setEditModalVisible(false); setCurrentNote(null); }}
          />
        )}
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title={currentNote?.title}
        open={viewModalVisible}
        onCancel={() => { setViewModalVisible(false); setCurrentNote(null); }}
        footer={[
          <Button key="close" onClick={() => { setViewModalVisible(false); setCurrentNote(null); }}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewModalVisible(false);
              if (currentNote) openEditModal(currentNote);
            }}
          >
            编辑
          </Button>
        ]}
        width={700}
      >
        {currentNote && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {currentNote.companyName && (
                <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none' }}>
                  {currentNote.companyName}
                </Tag>
              )}
              {currentNote.positionName && (
                <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none' }}>
                  {currentNote.positionName}
                </Tag>
              )}
              {currentNote.interviewer && (
                <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none' }}>
                  {currentNote.interviewer}
                </Tag>
              )}
              {currentNote.interviewRound && (
                <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none' }}>
                  {currentNote.interviewRound}
                </Tag>
              )}
              {currentNote.interviewDate && (
                <Tag style={{ background: '#F5F2EE', color: '#8B7355', border: 'none' }}>
                  {currentNote.interviewDate}
                </Tag>
              )}
            </div>
            <div style={{
              background: '#FAF8F5',
              padding: 16,
              borderRadius: 8,
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              color: '#5D5348'
            }}>
              {currentNote.content}
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
              创建于 {dayjs(currentNote.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewNoteList;