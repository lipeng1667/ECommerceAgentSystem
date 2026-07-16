import { CheckCircleOutlined, EyeOutlined, PictureOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Drawer, Row, Space, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { mockCreatives } from '../agentConfigMockData';

export function CreativeLibraryCard() {
  const { t } = useI18n();
  const [generating, setGenerating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [lastGen, setLastGen] = useState('3h ago');

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setLastGen('just now');
      message.success(t('creative.genDone'));
    }, 2000);
  };

  const handlePush = () => {
    setPushing(true);
    setTimeout(() => {
      setPushing(false);
      message.success(t('creative.pushDone'));
    }, 1500);
  };

  const previewCreative = mockCreatives.find(c => c.id === previewId);

  return (
    <Card
      style={{ marginBottom: 16, borderTop: '3px solid #ea580c' }}
      title={
        <Space>
          <PictureOutlined style={{ color: '#ea580c' }} />
          {t('creative.libraryTitle')}
          <Badge status="processing" />
          <Tag color="orange" style={{ fontSize: 11 }}>{t('creative.lastGen')}: {lastGen}</Tag>
        </Space>
      }
      extra={
        <Space size="small">
          <Button size="small" icon={<ReloadOutlined />} loading={generating} onClick={handleGenerate}>
            {t('creative.generateNow')}
          </Button>
          <Button size="small" type="primary" icon={<SendOutlined />} loading={pushing} onClick={handlePush}>
            {t('creative.pushToAds')}
          </Button>
        </Space>
      }
    >
      <Row gutter={[12, 12]}>
        {mockCreatives.map(creative => (
          <Col xs={24} sm={8} key={creative.id}>
            <Card
              hoverable
              size="small"
              style={{ borderTop: `3px solid ${creative.colors[0]}` }}
              bodyStyle={{ padding: 0 }}
            >
              {/* 模拟广告图预览 */}
              <div style={{
                height: 120,
                background: `linear-gradient(135deg, ${creative.colors[0]} 0%, ${creative.colors[1]} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: creative.colors[2], fontSize: 16, fontWeight: 700, letterSpacing: 1,
              }}>
                {creative.previewText}
              </div>
              <div style={{ padding: '8px 12px' }}>
                <Typography.Text strong style={{ fontSize: 13 }}>{creative.product}</Typography.Text>
                <Space size={4} style={{ marginTop: 4 }}>
                  <Tag color="purple" style={{ fontSize: 10 }}>{creative.size}</Tag>
                  <Tag color="blue" style={{ fontSize: 10 }}>{creative.tone}</Tag>
                </Space>
                <Typography.Paragraph style={{ fontSize: 11, margin: '6px 0', color: '#64748b', whiteSpace: 'pre-line', marginBottom: 0 }}>
                  {creative.copy}
                </Typography.Paragraph>
                <Space size="small" style={{ marginTop: 8 }}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewId(creative.id)}>
                    {t('creative.preview')}
                  </Button>
                  <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => message.success(t('creative.selected'))}>
                    {t('creative.use')}
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 预览抽屉 */}
      <Drawer
        title={previewCreative?.product}
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
        width={480}
        extra={
          <Space size="small">
            <Button size="small" icon={<ReloadOutlined />} onClick={() => message.success(t('creative.regenerated'))}>
              {t('creative.regenerate')}
            </Button>
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => { message.success(t('creative.pushDone')); setPreviewId(null); }}>
              {t('creative.pushToAds')}
            </Button>
          </Space>
        }
      >
        {previewCreative && (
          <div>
            {/* 大图预览 */}
            <div style={{
              height: 280,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${previewCreative.colors[0]} 0%, ${previewCreative.colors[1]} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: previewCreative.colors[2], fontSize: 28, fontWeight: 700, letterSpacing: 2,
              marginBottom: 16,
            }}>
              {previewCreative.previewText}
            </div>

            <Space size="small" style={{ marginBottom: 12 }}>
              <Tag color="purple">{previewCreative.size}</Tag>
              <Tag color="blue">{previewCreative.tone}</Tag>
            </Space>

            <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>{t('creative.adCopy')}</Typography.Title>
            <Typography.Paragraph style={{ fontSize: 13, whiteSpace: 'pre-line' }}>
              {previewCreative.copy}
            </Typography.Paragraph>

            <Typography.Title level={5} style={{ fontSize: 13, marginTop: 16, marginBottom: 8 }}>{t('creative.colorScheme')}</Typography.Title>
            <Space>
              {previewCreative.colors.map((color, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: color, border: '1px solid #e2e8f0' }} />
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>{color}</Typography.Text>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Drawer>
    </Card>
  );
}
