import { CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Card, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../../app/i18n';
import { BaseWorkflowModal } from './BaseWorkflowModal';
import {
  mockBreakerLogs,
  mockRiskScans,
} from '../agentConfigMockData';

interface RiskScanModalProps {
  riskOpen: boolean;
  onCloseRisk: () => void;
}

type RiskStatus = 'pending' | 'fixed' | 'ignored';

export function RiskScanModal(props: RiskScanModalProps) {
  const { t } = useI18n();
  const { riskOpen, onCloseRisk } = props;
  const [riskStatuses, setRiskStatuses] = useState<Record<number, RiskStatus>>({});

  return (
    <BaseWorkflowModal
      open={riskOpen}
      onClose={onCloseRisk}
      title={t('risk.scanTitle')}
      icon={<SafetyOutlined />}
      iconColor="#dc2626"
      width={820}
      defaultActiveKey="scan"
      tabs={[
        {
          key: 'scan',
          label: t('risk.scanTab', { count: mockRiskScans.filter(r => (riskStatuses[r.id] || 'pending') === 'pending').length }),
          children: (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {mockRiskScans.map(scan => (
                <Card
                  key={scan.id}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderLeft: `4px solid ${scan.severity === 'high' ? '#dc2626' : scan.severity === 'medium' ? '#ea580c' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 13 }}>{scan.product}</Typography.Text>
                      <Tag
                        color={scan.severity === 'high' ? 'red' : scan.severity === 'medium' ? 'orange' : 'gold'}
                        style={{ marginLeft: 8, fontSize: 10 }}
                      >
                        {scan.severity === 'high' ? t('risk.severityHigh') : scan.severity === 'medium' ? t('risk.severityMedium') : t('risk.severityLow')}
                      </Tag>
                    </div>
                    <Tag style={{ fontSize: 10 }}>{scan.rule}</Tag>
                  </div>
                  <Typography.Paragraph type="danger" style={{ fontSize: 12, margin: '0 0 6px', padding: '6px 10px', background: '#fef2f2', borderRadius: 6 }}>
                    {scan.issue}
                  </Typography.Paragraph>
                  <div style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', padding: '6px 10px', borderRadius: 6 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    {t('risk.suggestion')}: {scan.suggestion}
                  </div>
                  {(riskStatuses[scan.id] || 'pending') === 'pending' ? (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ fontSize: 10 }} onClick={() => { setRiskStatuses(prev => ({ ...prev, [scan.id]: 'fixed' })); message.success(t('risk.markedFixed')); }}>
                        {t('risk.markFixed')}
                      </Button>
                      <Button size="small" icon={<CloseCircleOutlined />} style={{ fontSize: 10 }} onClick={() => { setRiskStatuses(prev => ({ ...prev, [scan.id]: 'ignored' })); message.success(t('risk.ignoredSuccess')); }}>
                        {t('risk.ignore')}
                      </Button>
                    </div>
                  ) : (
                    <Tag color={riskStatuses[scan.id] === 'fixed' ? 'green' : 'default'} style={{ fontSize: 10, marginTop: 6 }}>
                      {riskStatuses[scan.id] === 'fixed' ? t('risk.fixed') : t('risk.ignored')}
                    </Tag>
                  )}
                </Card>
              ))}
            </div>
          )
        },
        {
          key: 'breaker',
          label: t('risk.breakerTab', { count: mockBreakerLogs.length }),
          children: (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {mockBreakerLogs.map(log => (
                <Card key={log.id} size="small" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Typography.Text strong style={{ fontSize: 13 }}>{log.agent}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>{log.time}</Typography.Text>
                  </div>
                  <Typography.Paragraph style={{ fontSize: 12, margin: '0 0 4px', padding: '6px 10px', background: '#fff7ed', borderRadius: 6, color: '#ea580c' }}>
                    {log.reason}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    {t('risk.action')}: {log.action}
                  </Typography.Text>
                  <Tag color={log.recovered ? 'green' : 'red'} style={{ fontSize: 10, marginTop: 4 }}>
                    {log.recovered ? `${t('risk.recovered')} · ${log.recoveredAt}` : t('risk.notRecovered')}
                  </Tag>
                </Card>
              ))}
            </div>
          )
        }
      ]}
    />
  );
}
