/**
 * RecognitionResultCard — product_launch Agent AI 识别结果编辑卡片。
 *
 * 展示图片识别后的商品信息（名称、价格、类目、属性、SEO标题、卖点、描述），
 * 支持手动编辑并确认创建任务。
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import { CheckCircleOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, Row, Space, Tag, Typography } from 'antd';
import { useI18n } from '../../app/i18n';
import type { ProductRecognitionResult } from './agentConfigMockData';

export interface RecognitionResultCardProps {
  result: ProductRecognitionResult;
  fileCount: number;
  loading: boolean;
  onResultChange: (result: ProductRecognitionResult) => void;
  onRegenerate: () => void;
  onConfirm: () => void;
}

export function RecognitionResultCard({
  result,
  fileCount,
  loading,
  onResultChange,
  onRegenerate,
  onConfirm,
}: RecognitionResultCardProps) {
  const { t } = useI18n();

  return (
    <Card
      title={<><EditOutlined style={{ marginRight: 8, color: '#16a34a' }} />{t('agent.recognizeResult')}</>}
      extra={
        <Space>
          <Tag color="green" style={{ fontSize: 11 }}>
            <CheckCircleOutlined /> {t('agent.recognizeDone')} · {fileCount} {t('common.images')}
          </Tag>
          <Button size="small" icon={<ReloadOutlined />} onClick={onRegenerate}>
            {t('agent.regenerate')}
          </Button>
        </Space>
      }
      style={{ marginBottom: 16, borderLeft: '3px solid #16a34a' }}
    >
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={16}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.recognizedProductName')}</Typography.Text>
          <Input
            style={{ marginTop: 4 }}
            value={result.productName}
            onChange={(e) => onResultChange({ ...result, productName: e.target.value })}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.generatedPrice')}</Typography.Text>
          <Input
            style={{ marginTop: 4 }}
            prefix="$"
            value={result.suggestedPrice}
            onChange={(e) => onResultChange({ ...result, suggestedPrice: Number(e.target.value) || 0 })}
          />
        </Col>
        <Col span={24}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.recognizedCategory')}</Typography.Text>
          <Input
            style={{ marginTop: 4 }}
            value={result.category}
            onChange={(e) => onResultChange({ ...result, category: e.target.value })}
          />
        </Col>
        <Col span={24}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.recognizedAttributes')}</Typography.Text>
          <Input.TextArea
            style={{ marginTop: 4 }} rows={2}
            value={result.attributes}
            onChange={(e) => onResultChange({ ...result, attributes: e.target.value })}
          />
        </Col>
        <Col span={24}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.generatedSeoTitle')}</Typography.Text>
          <Input.TextArea
            style={{ marginTop: 4 }} rows={2}
            value={result.seoTitle}
            onChange={(e) => onResultChange({ ...result, seoTitle: e.target.value })}
          />
        </Col>
        <Col span={24}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.generatedSellingPoints')}</Typography.Text>
          <Input.TextArea
            style={{ marginTop: 4 }} rows={3}
            value={result.sellingPoints}
            onChange={(e) => onResultChange({ ...result, sellingPoints: e.target.value })}
          />
        </Col>
        <Col span={24}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('agent.generatedDescription')}</Typography.Text>
          <Input.TextArea
            style={{ marginTop: 4 }} rows={4}
            value={result.description}
            onChange={(e) => onResultChange({ ...result, description: e.target.value })}
          />
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary" size="large" icon={<CheckCircleOutlined />} loading={loading}
          onClick={onConfirm}
        >
          {t('agent.confirmCreateTask')}
        </Button>
      </div>
    </Card>
  );
}
