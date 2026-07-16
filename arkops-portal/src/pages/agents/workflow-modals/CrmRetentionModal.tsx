import { TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row, Space, Tag, Typography, message } from 'antd';
import { useI18n } from '../../../app/i18n';
import { mockChurnRisks, mockCoupons, mockSegments } from '../agentConfigMockData';
import { BaseWorkflowModal } from './BaseWorkflowModal';

interface CrmRetentionModalProps {
  crmOpen: boolean;
  onCloseCrm: () => void;
}

export function CrmRetentionModal(props: CrmRetentionModalProps) {
  const { t } = useI18n();
  const { crmOpen, onCloseCrm } = props;

  return (
    <BaseWorkflowModal
      open={crmOpen}
      onClose={onCloseCrm}
      title={t('crm.title')}
      icon={<TeamOutlined />}
      iconColor="#2563eb"
      width={860}
      defaultActiveKey="segment"
      tabs={[
        {
          key: 'segment',
          label: t('crm.segmentTab'),
          children: (
            <div>
              <Row gutter={[16, 16]}>
                {/* 环形图 */}
                <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{
                    width: 200, height: 200, borderRadius: '50%',
                    background: `conic-gradient(
                      #2563eb 0deg ${mockSegments.new.pct * 3.6}deg,
                      #16a34a ${mockSegments.new.pct * 3.6}deg ${(mockSegments.new.pct + mockSegments.active.pct) * 3.6}deg,
                      #ea580c ${(mockSegments.new.pct + mockSegments.active.pct) * 3.6}deg ${(mockSegments.new.pct + mockSegments.active.pct + mockSegments.dormant.pct) * 3.6}deg,
                      #dc2626 ${(mockSegments.new.pct + mockSegments.active.pct + mockSegments.dormant.pct) * 3.6}deg 360deg
                    )`,
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 110, height: 110, borderRadius: '50%', background: '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography.Text strong style={{ fontSize: 22, color: '#2563eb' }}>
                        {Object.values(mockSegments).reduce((s, seg) => s + seg.count, 0)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>{t('crm.totalCustomers')}</Typography.Text>
                    </div>
                  </div>
                </Col>
                {/* 分层指标 */}
                <Col xs={24} md={14}>
                  {Object.entries(mockSegments).map(([key, seg]) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space size={6}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color }} />
                          <Typography.Text strong style={{ fontSize: 12 }}>{seg.label}</Typography.Text>
                          <Tag color="default" style={{ fontSize: 10 }}>{seg.pct}%</Tag>
                        </Space>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {seg.count} {t('crm.people')} · {t('crm.avgOrder')} ${seg.avgOrderValue}
                        </Typography.Text>
                      </div>
                      <Progress
                        percent={seg.pct}
                        strokeColor={seg.color}
                        size="small"
                        format={() => `${seg.count}${t('crm.people')}`}
                      />
                    </div>
                  ))}
                </Col>
              </Row>
            </div>
          )
        },
        {
          key: 'coupon',
          label: t('crm.couponTab'),
          children: (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                {t('crm.couponDesc', { count: mockCoupons.length, cost: mockCoupons.reduce((s, c) => s + c.estimatedCost, 0) })}
              </Typography.Text>
              {mockCoupons.map(coupon => (
                <Card key={coupon.id} size="small" style={{ marginBottom: 10, borderLeft: '4px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 13 }}>{coupon.name}</Typography.Text>
                      <div style={{ marginTop: 2 }}>
                        <Tag color="purple" style={{ fontSize: 9 }}>{coupon.type}</Tag>
                        <Tag color="blue" style={{ fontSize: 9 }}>
                          {coupon.target === 'new' ? t('crm.targetNew') : coupon.target === 'active' ? t('crm.targetActive') : coupon.target === 'dormant' ? t('crm.targetDormant') : t('crm.targetChurned')}
                        </Tag>
                      </div>
                    </div>
                    <Typography.Text strong style={{ fontSize: 18, color: '#7c3aed' }}>{coupon.value}</Typography.Text>
                  </div>
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    <Col span={6}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.minOrder')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>{coupon.minOrder === 0 ? t('crm.noThreshold') : `$${coupon.minOrder}`}</Typography.Text>
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.validity')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>{coupon.expiryDays} {t('crm.days')}</Typography.Text>
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.targetCount')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>{mockSegments[coupon.target as keyof typeof mockSegments].count} {t('crm.people')}</Typography.Text>
                    </Col>
                    <Col span={6}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.estimatedCost')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11, color: '#ea580c' }}>${coupon.estimatedCost}</Typography.Text>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    <Button size="small" type="primary" ghost style={{ fontSize: 10 }} onClick={() => message.success(t('crm.couponSent', { count: mockSegments[coupon.target as keyof typeof mockSegments].count }))}>{t('crm.sendAll')}</Button>
                    <Button size="small" style={{ fontSize: 10 }} onClick={() => message.success(t('crm.ruleSaved'))}>{t('crm.editRule')}</Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        },
        {
          key: 'churn',
          label: t('crm.churnTab', { count: mockChurnRisks.length }),
          children: (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {mockChurnRisks.map(risk => (
                <Card
                  key={risk.id}
                  size="small"
                  style={{
                    marginBottom: 10,
                    borderLeft: `4px solid ${risk.risk >= 70 ? '#dc2626' : risk.risk >= 50 ? '#ea580c' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: 13 }}>{risk.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        {risk.segment === 'dormant' ? t('crm.dormantCustomer') : risk.segment === 'active' ? t('crm.activeCustomer') : t('crm.newCustomer')}
                      </Typography.Text>
                    </div>
                    <Tag color={risk.risk >= 70 ? 'red' : risk.risk >= 50 ? 'orange' : 'gold'} style={{ fontSize: 10 }}>
                      {t('crm.churnRisk')} {risk.risk}%
                    </Tag>
                  </div>
                  <Row gutter={8} style={{ marginTop: 6 }}>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.lastPurchase')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>{risk.lastPurchase}</Typography.Text>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.totalSpent')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>${risk.totalSpent}</Typography.Text>
                    </Col>
                    <Col span={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{t('crm.historyOrders')}</Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>{risk.orders} {t('crm.orders')}</Typography.Text>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 6, padding: '6px 10px', background: '#fff7ed', borderRadius: 6 }}>
                    <Typography.Text type="warning" style={{ fontSize: 11 }}>
                      <WarningOutlined style={{ marginRight: 4, fontSize: 10 }} />
                      {risk.reason}
                    </Typography.Text>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    <Button size="small" type="primary" ghost style={{ fontSize: 10 }} onClick={() => message.success(t('crm.retentionSent', { name: risk.name }))}>{t('crm.sendRetention')}</Button>
                    <Button size="small" style={{ fontSize: 10 }} onClick={() => message.info(risk.reason)}>{t('crm.viewDetail')}</Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      ]}
    />
  );
}
