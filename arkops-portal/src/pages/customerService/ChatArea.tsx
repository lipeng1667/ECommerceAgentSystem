/**
 * Chat Area — V1.0 Customer Service right panel.
 * Message list + input + quick-reply integration + session actions.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, Popconfirm, Space, Tag, Typography } from 'antd';
import {
  CustomerServiceOutlined,
  RobotOutlined,
  SendOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { customerServiceApi } from '../../api/customerService';
import { useI18n } from '../../app/i18n';
import { QuickReplyPanel } from './QuickReplyPanel';
import type { AllMallId, CustomerSession, QuickReplyTemplate, Store } from '../../types/domain';

interface Props {
  session: CustomerSession | null;
  stores: Store[];
}

export function ChatArea({ session, stores }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['customerMessages', session?.id],
    queryFn: () => customerServiceApi.getMessages(session!.id),
    enabled: !!session,
    refetchInterval: 8000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['quickReplies'],
    queryFn: customerServiceApi.getQuickReplies,
  });

  const sendMutation = useMutation({
    mutationFn: () => customerServiceApi.sendMessage(session!.id, inputValue),
    onSuccess: () => {
      setInputValue('');
      queryClient.invalidateQueries({ queryKey: ['customerMessages', session?.id] });
      queryClient.invalidateQueries({ queryKey: ['customerSessions'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => customerServiceApi.updateSessionStatus(session!.id, 'closed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSessions'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => customerServiceApi.escalateToHuman(session!.id, escalateReason),
    onSuccess: () => {
      setEscalateModalOpen(false);
      setEscalateReason('');
      queryClient.invalidateQueries({ queryKey: ['customerMessages', session?.id] });
      queryClient.invalidateQueries({ queryKey: ['customerSessions'] });
    },
  });

  const handleQuickReplySelect = (tmpl: QuickReplyTemplate) => {
    setInputValue(tmpl.text);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!session) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--ark-text-tertiary)' }}>
        <CustomerServiceOutlined style={{ fontSize: 48 }} />
        <Typography.Text type="secondary">{t('cs.selectSession')}</Typography.Text>
      </div>
    );
  }

  const store = stores.find((s) => s.id === session.storeId);

  const statusColors: Record<string, string> = {
    pending_reply: 'red',
    replied: 'blue',
    closed: 'default',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Chat header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--ark-border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--ark-bg-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--ark-purple-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ark-purple)', fontWeight: 600, fontSize: 14,
          }}>
            {session.buyerName[0]}
          </div>
          <div>
            <Space size={4}>
              <Typography.Text strong style={{ fontSize: 14 }}>{session.buyerName}</Typography.Text>
              <Tag color={statusColors[session.status]} style={{ fontSize: 11 }}>{t(`cs.status_${session.status}`)}</Tag>
            </Space>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                <ShopOutlined style={{ marginRight: 3 }} />
                {store?.name ?? '-'}
                {session.tags.length > 0 && ` · ${session.tags.join('、')}`}
              </Typography.Text>
            </div>
          </div>
        </div>
        <Space>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            type={showQuickReplies ? 'primary' : 'default'}
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            {t('cs.quickReplies')}
          </Button>
          <Popconfirm
            title={t('cs.escalateToHuman')}
            description={t('cs.escalateConfirm')}
            onConfirm={() => setEscalateModalOpen(true)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button size="small" icon={<UserSwitchOutlined />}>
              {t('cs.escalateToHuman')}
            </Button>
          </Popconfirm>
          {session.status !== 'closed' && (
            <Popconfirm
              title={t('cs.closeConfirm')}
              onConfirm={() => closeMutation.mutate()}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button size="small" danger>{t('cs.closeSession')}</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Message list + quick reply panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: 'var(--ark-bg-sink)' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(session.lastMessageAt).format('YYYY-MM-DD HH:mm')}
            </Typography.Text>
          </div>
          {messages.map((msg) => {
            const isBuyer = msg.sender === 'buyer';
            const isSystem = msg.sender === 'system';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isSystem ? 'center' : isBuyer ? 'flex-start' : 'flex-end',
                  marginBottom: 8,
                }}
              >
                {isSystem ? (
                  <Tag style={{ fontSize: 11 }}>{msg.content}</Tag>
                ) : (
                  <div style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isBuyer ? 'var(--ark-bg-surface)' : 'var(--ark-purple-soft)',
                    border: `1px solid ${isBuyer ? 'var(--ark-border-soft)' : 'var(--ark-purple)'}`,
                    wordBreak: 'break-word',
                  }}>
                    <Typography.Text style={{ fontSize: 13, lineHeight: '20px' }}>
                      {msg.content}
                    </Typography.Text>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                      {msg.isAutoReply && (
                        <RobotOutlined style={{ fontSize: 10, color: 'var(--ark-text-tertiary)' }} />
                      )}
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                        {dayjs(msg.createdAt).format('HH:mm')}
                      </Typography.Text>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {showQuickReplies && (
          <QuickReplyPanel templates={templates} onSelect={handleQuickReplySelect} />
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid var(--ark-border-soft)',
        background: 'var(--ark-bg-surface)', display: 'flex', gap: 8,
      }}>
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('cs.typeMessage')}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              if (inputValue.trim()) sendMutation.mutate();
            }
          }}
          disabled={session.status === 'closed'}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => sendMutation.mutate()}
          loading={sendMutation.isPending}
          disabled={!inputValue.trim() || session.status === 'closed'}
        />
      </div>

      {/* Escalate modal */}
      <Modal
        title={t('cs.escalateToHuman')}
        open={escalateModalOpen}
        onOk={() => escalateReason.trim() && escalateMutation.mutate()}
        onCancel={() => { setEscalateModalOpen(false); setEscalateReason(''); }}
        confirmLoading={escalateMutation.isPending}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {t('cs.escalateDescription')}
        </Typography.Paragraph>
        <Input.TextArea
          value={escalateReason}
          onChange={(e) => setEscalateReason(e.target.value)}
          placeholder={t('cs.escalatePlaceholder')}
          rows={3}
        />
      </Modal>
    </div>
  );
}
