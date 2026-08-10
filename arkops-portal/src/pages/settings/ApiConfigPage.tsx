/**
 * API & Webhook Config Page — V1.4
 * Manage API keys, webhooks, view documentation.
 */
import { useState } from 'react';
import { KeyOutlined, LinkOutlined, FileTextOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, List, Modal, Popconfirm, Row, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';

interface ApiKey { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string; }
interface Webhook { id: string; url: string; events: string[]; active: boolean; createdAt: string; }

const mockKeys: ApiKey[] = [
  { id: 'key_1', name: 'ERP 集成', prefix: 'amk_live_3x8...', createdAt: '2026-07-15', lastUsedAt: '2026-08-10' },
  { id: 'key_2', name: '数据分析导出', prefix: 'amk_live_7f2...', createdAt: '2026-08-01', lastUsedAt: '2026-08-09' },
];
const mockWebhooks: Webhook[] = [
  { id: 'wh_1', url: 'https://erp.mycompany.com/allmall/orders', events: ['order.created', 'order.shipped'], active: true, createdAt: '2026-07-20' },
];

export function ApiConfigPage() {
  const { t } = useI18n();
  const [keys, setKeys] = useState(mockKeys);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [keyName, setKeyName] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['order.created']);

  const handleGenerateKey = () => {
    if (!keyName.trim()) return;
    const newKey: ApiKey = { id: `key_${Date.now()}`, name: keyName, prefix: `amk_live_${Math.random().toString(36).slice(2, 10)}...`, createdAt: new Date().toISOString().split('T')[0], lastUsedAt: '-' };
    setKeys([...keys, newKey]);
    setGeneratedKey(`amk_live_${Math.random().toString(36).slice(2, 34)}`);
    setShowKeyModal(false);
    setKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    message.success(t('api.keyRevoked'));
  };

  const handleAddWebhook = () => {
    if (!webhookUrl.trim()) return;
    setWebhooks([...webhooks, { id: `wh_${Date.now()}`, url: webhookUrl, events: webhookEvents, active: true, createdAt: new Date().toISOString().split('T')[0] }]);
    setWebhookUrl('');
    message.success(t('api.webhookCreated'));
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <PageHeader title={t('nav.api')} description={t('api.subtitle')} />

      <div style={{ padding: '0 24px' }}>
        <Row gutter={[16, 16]}>
          {/* API Keys */}
          <Col xs={24} lg={12}>
            <Card
              title={<><KeyOutlined />{t('api.apiKeys')}</>}
              size="small"
              extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setShowKeyModal(true)}>{t('api.createKey')}</Button>}
            >
              {keys.map((key) => (
                <Card key={key.id} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography.Text strong>{key.name}</Typography.Text>
                      <br />
                      <Typography.Text code style={{ fontSize: 11 }}>{key.prefix}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {t('common.created')}: {key.createdAt} · {t('common.lastUsed')}: {key.lastUsedAt}
                      </Typography.Text>
                    </div>
                    <Popconfirm title={t('api.keyRevokeConfirm')} onConfirm={() => handleRevokeKey(key.id)} okText={t('common.confirm')} cancelText={t('common.cancel')}>
                      <Button size="small" danger>{t('common.revoke')}</Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
              {keys.length === 0 && <Empty description={t('common.noData')} />}
            </Card>
          </Col>

          {/* Webhooks */}
          <Col xs={24} lg={12}>
            <Card
              title={<><LinkOutlined />{t('api.webhooks')}</>}
              size="small"
            >
              {webhooks.map((wh) => (
                <Card key={wh.id} size="small" style={{ marginBottom: 8 }}>
                  <Typography.Text code style={{ fontSize: 11 }}>{wh.url}</Typography.Text>
                  <br />
                  <Space size={4} wrap style={{ margin: '4px 0' }}>
                    {wh.events.map((e) => <Tag key={e} color="blue">{e}</Tag>)}
                  </Space>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={wh.active ? 'green' : 'default'}>{wh.active ? t('api.webhookActive') : t('ads.paused')}</Tag>
                    <Space>
                      <Button size="small" onClick={() => message.success(t('api.webhookTestSent'))}>{t('api.webhookTest')}</Button>
                      <Button size="small" danger>{t('common.delete')}</Button>
                    </Space>
                  </div>
                </Card>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Input placeholder={t('api.webhookUrlPlaceholder')} value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} size="small" style={{ flex: 1 }} />
                <Button size="small" icon={<PlusOutlined />} onClick={handleAddWebhook}>{t('nav.api')}</Button>
              </div>
            </Card>

            {/* API Docs */}
            <Card size="small" style={{ marginTop: 16 }} title={<><FileTextOutlined />{t('api.docsTitle')}</>}>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>{t('api.docsDesc')}</Typography.Paragraph>
              <Button type="primary" ghost icon={<FileTextOutlined />}>{t('api.viewDocs')}</Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
