import { ArrowUpOutlined, CheckOutlined, LineChartOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface PricingAnalysisModalProps {
  open: boolean;
  onClose: () => void;
}

const mockComparison = [
  { id: 1, product: 'Wireless Earbuds Pro 2', ourPrice: 32.99, costPrice: 14.50, margin: 56, competitorAvg: 29.75, minCompetitor: 28.99 },
  { id: 2, product: 'USB-C Fast Charger 65W', ourPrice: 24.99, costPrice: 10.00, margin: 60, competitorAvg: 23.74, minCompetitor: 22.49 },
  { id: 3, product: 'Smart Watch Lite', ourPrice: 39.99, costPrice: 18.00, margin: 55, competitorAvg: 42.00, minCompetitor: 38.00 },
  { id: 4, product: 'Bluetooth Speaker Mini', ourPrice: 18.99, costPrice: 8.50, margin: 55, competitorAvg: 19.99, minCompetitor: 17.99 },
];

const mockSuggestions = [
  { id: 1, product: 'Wireless Earbuds Pro 2', ourPrice: 32.99, suggestedPrice: 29.99, expectedMargin: 52, confidence: 85, reason: '5% below competitor avg to gain Buy Box' },
  { id: 2, product: 'USB-C Fast Charger 65W', ourPrice: 24.99, suggestedPrice: 23.49, expectedMargin: 57, confidence: 72, reason: 'Match lowest competitor to stay competitive' },
  { id: 3, product: 'Smart Watch Lite', ourPrice: 39.99, suggestedPrice: 41.99, expectedMargin: 57, confidence: 68, reason: 'Price is below market avg, room to increase' },
];

export function PricingAnalysisModal({ open, onClose }: PricingAnalysisModalProps) {
  const { t } = useI18n();
  const [applied, setApplied] = useState<number[]>([]);

  const handleApply = (id: number, price: number) => {
    setApplied(prev => [...prev, id]);
    message.success(t('pricing.applySuccess', { price: price.toFixed(2) }));
  };

  const comparisonColumns = [
    { title: t('pricing.product'), dataIndex: 'product', render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    { title: t('pricing.ourPrice'), dataIndex: 'ourPrice', width: 90, render: (v: number) => <Typography.Text style={{ fontSize: 13 }}>${v.toFixed(2)}</Typography.Text> },
    { title: t('pricing.costPrice'), dataIndex: 'costPrice', width: 80, render: (v: number) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>${v.toFixed(2)}</Typography.Text> },
    {
      title: t('pricing.margin'), dataIndex: 'margin', width: 80,
      render: (v: number) => <Tag color={v >= 55 ? 'green' : v >= 40 ? 'orange' : 'red'} style={{ fontSize: 11 }}>{v}%</Tag>,
    },
    { title: t('pricing.competitorAvg'), dataIndex: 'competitorAvg', width: 100, render: (v: number) => `$${v.toFixed(2)}` },
    { title: t('pricing.minCompetitor'), dataIndex: 'minCompetitor', width: 100, render: (v: number) => <Typography.Text style={{ color: '#dc2626', fontSize: 12 }}>${v.toFixed(2)}</Typography.Text> },
  ];

  const suggestionColumns = [
    { title: t('pricing.product'), dataIndex: 'product', render: (v: string) => <Typography.Text strong style={{ fontSize: 13 }}>{v}</Typography.Text> },
    { title: t('pricing.ourPrice'), dataIndex: 'ourPrice', width: 90, render: (v: number) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>${v.toFixed(2)}</Typography.Text> },
    {
      title: t('pricing.suggestedPrice'), dataIndex: 'suggestedPrice', width: 110,
      render: (v: number) => <Typography.Text strong style={{ color: '#2563eb', fontSize: 13 }}>${v.toFixed(2)}</Typography.Text>,
    },
    {
      title: t('pricing.expectedMargin'), dataIndex: 'expectedMargin', width: 100,
      render: (v: number) => <Tag color={v >= 50 ? 'green' : 'orange'} style={{ fontSize: 11 }}>{v}%</Tag>,
    },
    {
      title: t('pricing.confidence'), dataIndex: 'confidence', width: 100,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 80 ? '#16a34a' : v >= 60 ? '#f59e0b' : '#dc2626'} format={(p) => <span style={{ fontSize: 11 }}>{p}</span>} />,
    },
    { title: t('pricing.reason'), dataIndex: 'reason', ellipsis: true, render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 11 }}>{v}</Typography.Text> },
    {
      title: '', width: 80,
      render: (_: unknown, r: typeof mockSuggestions[0]) => applied.includes(r.id) ? <Tag color="green" icon={<CheckOutlined />} style={{ fontSize: 11 }}>OK</Tag> : <Button size="small" type="primary" onClick={() => handleApply(r.id, r.suggestedPrice)}>{t('pricing.applySuggestion')}</Button>,
    },
  ];

  const avgMargin = Math.round(mockComparison.reduce((s, r) => s + r.margin, 0) / mockComparison.length);

  return (
    <BaseWorkflowModal
      open={open}
      onClose={onClose}
      title={t('pricing.title')}
      icon={<LineChartOutlined />}
      iconColor="#2563eb"
      width={900}
      preContent={
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}><Card size="small"><Statistic title={t('pricing.competitorAvg')} value={mockComparison.length} suffix="products" /></Card></Col>
          <Col span={12}><Card size="small"><Statistic title={t('pricing.margin')} value={avgMargin} suffix="%" valueStyle={{ color: avgMargin >= 50 ? '#16a34a' : '#f59e0b' }} /></Card></Col>
        </Row>
      }
      tabs={[
        { key: 'comparison', label: t('pricing.comparisonTab', { count: mockComparison.length }), children: <Table dataSource={mockComparison} columns={comparisonColumns} rowKey="id" pagination={false} size="small" /> },
        { key: 'history', label: t('pricing.historyTab'), children: <Card size="small"><div style={{ textAlign: 'center', padding: 32 }}><LineChartOutlined style={{ fontSize: 48, color: '#cbd5e1' }} /><Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>{t('pricing.last30Days')}</Typography.Text></div></Card> },
        { key: 'suggestion', label: t('pricing.suggestionTab', { count: mockSuggestions.length }), children: <Table dataSource={mockSuggestions} columns={suggestionColumns} rowKey="id" pagination={false} size="small" /> },
      ]}
    />
  );
}
