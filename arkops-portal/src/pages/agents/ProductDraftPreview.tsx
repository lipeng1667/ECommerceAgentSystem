import { CheckCircleOutlined, ReloadOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Col, Descriptions, Drawer, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import type { AllMallId, Task } from '../../types/domain';
import type { ProductDraft } from './agentConfigMockData';
import { useI18n } from '../../app/i18n';

interface ProductDraftPreviewProps {
  draft: ProductDraft;
  task: Task;
  onRegenerate: (taskId: AllMallId) => void;
  onCancel: (taskId: AllMallId) => void;
}

export function ProductDraftPreview({ draft, task, onRegenerate, onCancel }: ProductDraftPreviewProps) {
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const canRegenerate = task.status === 'queued' || task.status === 'draft';

  return (
    <div style={{ padding: '4px 0' }}>
      {/* 紧凑预览行 */}
      <Row gutter={12} align="middle">
        <Col flex="auto">
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Space size="small">
              <Tag color="blue" style={{ fontSize: 11 }}>{draft.platform}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{draft.category}</Typography.Text>
            </Space>
            <Space size="small">
              <Statistic title={t('draft.sellingPrice')} value={draft.sellingPrice} prefix="$" precision={2} valueStyle={{ fontSize: 14, color: '#2563eb' }} />
              <Statistic title={t('draft.grossMargin')} value={((draft.sellingPrice - draft.costPrice) / draft.sellingPrice * 100).toFixed(0)} suffix="%" valueStyle={{ fontSize: 14, color: '#16a34a' }} />
              <Statistic title={t('draft.totalStock')} value={draft.totalStock} valueStyle={{ fontSize: 14 }} />
            </Space>
          </Space>
        </Col>
        <Col>
          <Space size="small">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDrawerOpen(true)}>
              {t('draft.preview')}
            </Button>
            {canRegenerate && (
              <Button size="small" icon={<ReloadOutlined />} onClick={() => onRegenerate(task.id)}>
                {t('draft.regenerate')}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{draft.productName}</Typography.Text>
            <Space size="small">
              <Tag color="blue" style={{ fontSize: 11 }}>{draft.platform}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{draft.category}</Typography.Text>
            </Space>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
        extra={
          <Space size="small">
            {canRegenerate && (
              <Button size="small" icon={<ReloadOutlined />} onClick={() => { onRegenerate(task.id); setDrawerOpen(false); }}>
                {t('draft.regenerate')}
              </Button>
            )}
            <Button size="small" danger icon={<StopOutlined />} onClick={() => { onCancel(task.id); setDrawerOpen(false); }}>
              {t('draft.cancel')}
            </Button>
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => { message.success(t('draft.submitted', { name: draft.productName })); setDrawerOpen(false); }}>
              {t('draft.confirmList')}
            </Button>
          </Space>
        }
      >
        {/* SKU 信息 */}
        <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('draft.skuInfo')}</Typography.Title>
        <Table
          rowKey="skuCode"
          dataSource={draft.skus}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
          columns={[
            { title: t('draft.spec'), dataIndex: 'spec', ellipsis: true },
            { title: t('draft.skuCode'), dataIndex: 'skuCode', width: 130, ellipsis: true, render: (v: string) => <Typography.Text code style={{ fontSize: 11 }}>{v}</Typography.Text> },
            { title: t('draft.price'), dataIndex: 'price', width: 80, align: 'right' as const, render: (v: number) => <Typography.Text strong>${v.toFixed(2)}</Typography.Text> },
            { title: t('draft.stock'), dataIndex: 'stock', width: 70, align: 'right' as const },
          ]}
        />

        {/* 价格体系 */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={8}><Statistic title={t('draft.costPrice')} value={draft.costPrice} prefix="$" precision={2} valueStyle={{ fontSize: 16 }} /></Col>
          <Col span={8}><Statistic title={t('draft.sellingPrice')} value={draft.sellingPrice} prefix="$" precision={2} valueStyle={{ fontSize: 16, color: '#2563eb' }} /></Col>
          <Col span={8}><Statistic title={t('draft.grossMargin')} value={((draft.sellingPrice - draft.costPrice) / draft.sellingPrice * 100).toFixed(0)} suffix="%" valueStyle={{ fontSize: 16, color: '#16a34a' }} /></Col>
        </Row>

        {/* 库存物流 */}
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label={t('draft.totalStock')}>{draft.totalStock} {t('draft.units')}</Descriptions.Item>
          <Descriptions.Item label={t('draft.weight')}>{draft.weight}</Descriptions.Item>
          <Descriptions.Item label={t('draft.dimensions')}>{draft.dimensions}</Descriptions.Item>
          <Descriptions.Item label={t('draft.shippingFrom')}>{draft.shippingFrom}</Descriptions.Item>
        </Descriptions>

        {/* 通用属性 */}
        <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('draft.genericAttrs')}</Typography.Title>
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          {draft.genericAttrs.map(attr => (
            <Descriptions.Item key={attr.label} label={attr.label}>{attr.value}</Descriptions.Item>
          ))}
        </Descriptions>

        {/* 类目属性 */}
        <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('draft.categoryAttrs')}</Typography.Title>
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          {draft.categoryAttrs.map(attr => (
            <Descriptions.Item key={attr.label} label={attr.label}>{attr.value}</Descriptions.Item>
          ))}
        </Descriptions>

        {/* 媒体素材 */}
        <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('draft.mediaAssets')}</Typography.Title>
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={6}><Statistic title={t('draft.mainImages')} value={draft.mainImages} valueStyle={{ fontSize: 14 }} /></Col>
          <Col span={6}><Statistic title={t('draft.skuImages')} value={draft.skuImages} valueStyle={{ fontSize: 14 }} /></Col>
          <Col span={6}><Statistic title={t('draft.detailImages')} value={draft.detailImages} valueStyle={{ fontSize: 14 }} /></Col>
          <Col span={6}><Statistic title={t('draft.shortVideo')} value={draft.hasVideo ? t('draft.videoGenerated') : t('draft.videoNotGenerated')} valueStyle={{ fontSize: 14, color: draft.hasVideo ? '#16a34a' : '#94a3b8' }} /></Col>
        </Row>

        {/* AI 文案 */}
        <div style={{ background: '#f0f5ff', borderLeft: '3px solid #2563eb', padding: 12, borderRadius: 4 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>{t('draft.aiCopyTitle')}</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('draft.seoTitle')}</Typography.Text>
            <Typography.Paragraph code style={{ fontSize: 12, margin: '2px 0', wordBreak: 'break-all' }}>{draft.seoTitle}</Typography.Paragraph>
          </div>
          <div style={{ marginTop: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('draft.sellingPoints')}</Typography.Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              {draft.sellingPoints.map((sp, i) => (
                <Tag key={i} color="purple" style={{ fontSize: 11 }}>{sp}</Tag>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('draft.detailDescription')}</Typography.Text>
            <Typography.Paragraph style={{ fontSize: 12, margin: '2px 0', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{draft.description}</Typography.Paragraph>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
