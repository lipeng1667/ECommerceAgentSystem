import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Segmented,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../app/i18n';
import { useStoreScope } from '../../app/storeScope';
import { mockReport, filterByStore } from '../../mock/data';

const { Text, Paragraph } = Typography;

const LEVEL_CONFIG: Record<string, { color: string; tagColor: string }> = {
  critical: { color: '#EF4444', tagColor: 'red' },
  medium: { color: '#F59E0B', tagColor: 'orange' },
  normal: { color: '#10B981', tagColor: 'green' },
};

export function DecisionCenter() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<string>('all');
  const { storeId, stores } = useStoreScope();

  const storeName = stores.find((s) => s.id === storeId)?.name;

  const storeFilteredDecisions = filterByStore(mockReport.decisions, storeId);

  const FILTER_OPTIONS = [
    { label: t('decision.filterAll'), value: 'all' },
    { label: t('decision.filterCritical'), value: 'critical' },
    { label: t('decision.filterPending'), value: 'pending' },
  ];

  const filteredDecisions = useMemo(() => {
    if (filter === 'all') return storeFilteredDecisions;
    if (filter === 'critical') return storeFilteredDecisions.filter((d) => d.level === 'critical');
    return storeFilteredDecisions.filter((d) => d.level !== 'critical');
  }, [filter, storeFilteredDecisions]);

  const handleApprove = (decId: string) => {
    message.success(t('decision.actionConfirm', { action: t('decision.approve'), decId }));
  };

  const handleModify = (decId: string) => {
    message.info(t('decision.actionConfirm', { action: t('decision.modify'), decId }));
  };

  const handleIgnore = (decId: string) => {
    message.info(t('decision.actionConfirm', { action: t('decision.ignore'), decId }));
  };

  const getLevelLabel = (level: string) => {
    if (level === 'critical') return t('decision.levelCritical');
    if (level === 'medium') return t('decision.levelMedium');
    return t('decision.levelNormal');
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 18, color: '#1E293B' }}>
            {t('decision.title')}
          </Text>
          {storeName && (
            <Text type="secondary" style={{ fontSize: 13, marginLeft: 12 }}>
              {t('store.shopName')}: {storeName}
            </Text>
          )}
        </div>
        <Segmented
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(val) => setFilter(val as string)}
          size="small"
        />
      </div>

      {/* Decision Cards */}
      {filteredDecisions.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            color: '#94A3B8',
          }}
        >
          <CheckCircleFilled style={{ fontSize: 48, color: '#10B981', marginBottom: 16 }} />
          <Text type="secondary" style={{ fontSize: 15 }}>
            {storeId ? t('decision.empty') : t('decision.empty')}
          </Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredDecisions.map((dec) => {
            const levelCfg = LEVEL_CONFIG[dec.level] || LEVEL_CONFIG.normal;
            return (
              <Card
                key={dec.id}
                size="small"
                style={{
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${levelCfg.color}`,
                }}
                styles={{ body: { padding: '14px 20px' } }}
              >
                {/* Top row: level tag + title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Tag color={levelCfg.tagColor} style={{ margin: 0, flexShrink: 0 }}>
                    {getLevelLabel(dec.level)}
                  </Tag>
                  <Text strong style={{ fontSize: 14, lineHeight: '22px', color: '#1E293B' }}>
                    {dec.title}
                  </Text>
                </div>

                {/* Summary */}
                <Paragraph
                  type="secondary"
                  style={{
                    fontSize: 13,
                    marginBottom: 8,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {dec.summary}
                </Paragraph>

                {/* Agent + time + actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dec.agentName} · {dec.createdAt}
                  </Text>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(dec.id)}
                      style={{
                        background: '#4F46E5',
                        borderColor: '#4F46E5',
                        borderRadius: 6,
                      }}
                    >
                      {t('decision.approve')}
                    </Button>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleModify(dec.id)}
                      style={{ borderRadius: 6 }}
                    >
                      {t('decision.modify')}
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleIgnore(dec.id)}
                      style={{ color: '#94A3B8', padding: '0 8px' }}
                    >
                      {t('decision.ignore')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
