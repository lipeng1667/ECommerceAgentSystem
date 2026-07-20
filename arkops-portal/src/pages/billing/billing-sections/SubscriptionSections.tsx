import {
  BankOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  CrownOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MailOutlined,
  PhoneOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  SwapOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Descriptions, Form, Input, message, Progress, Row, Statistic, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { financeApi } from '../../../api/finance';
import { useI18n } from '../../../app/i18n';
import { TrendBarChart } from '../../../components/charts/TrendBarChart';
import { MetricCard } from '../../../components/metrics/MetricCard';
import type { BillingRecord, SubscriptionPlan } from '../../../types/domain';

// ========== 订阅计划对比表格 ==========

interface PlanFeatureRow {
  key: string;
  label: string;
  values: Record<string, string | number | boolean>;
}

export function PlansSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: currentPlan } = useQuery({ queryKey: ['currentPlan'], queryFn: financeApi.getCurrentPlan });
  const { data: allPlans } = useQuery({ queryKey: ['allPlans'], queryFn: financeApi.getAllPlans });
  const upgradeMutation = useMutation({
    mutationFn: financeApi.upgradePlan,
    onSuccess: () => {
      message.success(t('subscription.upgradeSuccess'));
      queryClient.invalidateQueries({ queryKey: ['currentPlan'] });
    }
  });

  const tiers: SubscriptionPlan['tier'][] = ['Free', 'Starter', 'Professional', 'Enterprise'];
  const colorMap: Record<string, string> = { Free: '#94a3b8', Starter: '#2563eb', Professional: '#7c3aed', Enterprise: '#ea580c' };

  const planMap = new Map(allPlans?.map((p) => [p.tier, p]));

  const formatStoreLimit = (limit: number) => limit >= 999 ? t('subscription.unlimited') : limit;
  const formatOps = (ops: number) => ops >= 99999 ? t('subscription.unlimited') : ops.toLocaleString();
  const formatConcurrency = (c: number) => c >= 999 ? t('subscription.unlimited') : c;

  const columns: ColumnsType<PlanFeatureRow> = [
    {
      title: t('subscription.feature'),
      dataIndex: 'label',
      key: 'label',
      width: 140,
      render: (_: unknown, record: PlanFeatureRow) => (
        <Typography.Text strong>{record.label}</Typography.Text>
      ),
    },
    ...tiers.map((tier) => ({
      title: <Typography.Text strong style={{ color: colorMap[tier], fontSize: 14 }}>{tier}</Typography.Text>,
      key: tier,
      align: 'center' as const,
      render: (_: unknown, record: PlanFeatureRow) => {
        const val = record.values[tier];
        if (record.key === 'upgrade') {
          if (currentPlan?.tier === tier) {
            return <Tag color="blue">{t('subscription.currentPlan')}</Tag>;
          }
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => upgradeMutation.mutate(tier)}
              loading={upgradeMutation.isPending}
            >
              {t('subscription.upgrade')}
            </Button>
          );
        }
        if (record.key === 'price') {
          return <Typography.Text strong style={{ color: colorMap[tier], fontSize: 16 }}>¥{val}<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('subscription.perMonth')}</Typography.Text></Typography.Text>;
        }
        if (typeof val === 'boolean') {
          return val
            ? <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 16 }} />
            : <CloseOutlined style={{ color: '#dc2626', fontSize: 16 }} />;
        }
        return <span>{val}</span>;
      },
    })),
  ];

  const rows: PlanFeatureRow[] = [
    {
      key: 'stores',
      label: t('subscription.stores'),
      values: Object.fromEntries(tiers.map((tier) => [tier, planMap.has(tier) ? formatStoreLimit(planMap.get(tier)!.storeLimit) : '-'])),
    },
    {
      key: 'concurrency',
      label: t('subscription.agentConcurrency'),
      values: Object.fromEntries(tiers.map((tier) => [tier, planMap.has(tier) ? formatConcurrency(planMap.get(tier)!.agentConcurrency) : '-'])),
    },
    {
      key: 'monthlyOps',
      label: t('subscription.monthlyOps'),
      values: Object.fromEntries(tiers.map((tier) => [tier, planMap.has(tier) ? formatOps(planMap.get(tier)!.monthlyOps) : '-'])),
    },
    {
      key: 'model',
      label: t('subscription.model'),
      values: {
        Free: t('subscription.basicModel'),
        Starter: t('subscription.standardModel'),
        Professional: t('subscription.advancedModel'),
        Enterprise: t('subscription.allModels'),
      },
    },
    {
      key: 'approval',
      label: t('subscription.approval'),
      values: { Free: false, Starter: true, Professional: true, Enterprise: true },
    },
    {
      key: 'dataRetention',
      label: t('subscription.dataRetention'),
      values: {
        Free: t('subscription.retention7d'),
        Starter: t('subscription.retention30d'),
        Professional: t('subscription.retention90d'),
        Enterprise: t('subscription.retentionForever'),
      },
    },
    {
      key: 'support',
      label: t('subscription.support'),
      values: {
        Free: t('subscription.community'),
        Starter: t('subscription.email_support'),
        Professional: t('subscription.priority'),
        Enterprise: t('subscription.dedicated'),
      },
    },
    {
      key: 'price',
      label: t('subscription.price'),
      values: Object.fromEntries(tiers.map((tier) => [tier, planMap.has(tier) ? planMap.get(tier)!.price : '-'])),
    },
    {
      key: 'upgrade',
      label: '',
      values: { Free: '', Starter: '', Professional: '', Enterprise: '' },
    },
  ];

  return (
    <Card title={<><RocketOutlined /> {t('subscription.plans')}</>} style={{ marginBottom: 24 }}>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        bordered
        rowClassName={(record) => record.key === 'upgrade' ? 'plan-upgrade-row' : ''}
      />
      <style>{`
        .plan-upgrade-row td { border-bottom: none !important; }
      `}</style>
    </Card>
  );
}

// ========== 当前套餐 + 续费周期 ==========

export function CurrentPlanSection() {
  const { t } = useI18n();
  const { data: currentPlan } = useQuery({ queryKey: ['currentPlan'], queryFn: financeApi.getCurrentPlan });

  return (
    <Card title={<><CrownOutlined /> {t('subscription.currentPlan')}</>} style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title={t('subscription.currentPlan')} value={currentPlan?.tier ?? '-'} valueStyle={{ color: '#2563eb', fontWeight: 700 }} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title={t('subscription.nextBillDate')} value="2026-07-01" valueStyle={{ fontWeight: 600 }} />
          <Typography.Text type="secondary">{t('subscription.autoRenew')} <Tag color="green" style={{ marginLeft: 4 }}>{t('subscription.autoRenewOn')}</Tag></Typography.Text>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title={t('subscription.billingCycle')} value={t('subscription.monthly')} prefix={<SwapOutlined />} valueStyle={{ fontWeight: 600 }} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t('subscription.autoRenew')}</Typography.Text>
          <Switch defaultChecked />
          <Tag color="green" style={{ marginLeft: 8 }}>{t('subscription.autoRenewOn')}</Tag>
        </Col>
      </Row>
    </Card>
  );
}

// ========== 支付方式 ==========

export function PaymentMethodsSection() {
  const { t } = useI18n();

  return (
    <Card title={<><WalletOutlined /> {t('subscription.paymentMethods')}</>} style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-primary" style={{ borderLeft: '3px solid #2563eb' }}>
            <div className="stat-card-icon"><CreditCardOutlined /></div>
            <Typography.Text strong>{t('subscription.creditCard')}</Typography.Text>
            <br />
            <Typography.Text type="secondary">Visa •••• 4242</Typography.Text>
            <br />
            <Tag color="green" style={{ marginTop: 8 }}>{t('subscription.default')}</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-purple" style={{ borderLeft: '3px solid #7c3aed' }}>
            <div className="stat-card-icon"><BankOutlined /></div>
            <Typography.Text strong>{t('subscription.bankTransfer')}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{t('subscription.bankTransferDesc')}</Typography.Text>
            <br />
            <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }}>{t('subscription.viewDetails')}</Button>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-success" style={{ borderLeft: '3px solid #0f766e' }}>
            <div className="stat-card-icon"><SwapOutlined /></div>
            <Typography.Text strong>{t('subscription.transfer')}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{t('subscription.transferDesc')}</Typography.Text>
            <br />
            <Button type="primary" size="small" ghost style={{ marginTop: 8 }}>{t('subscription.addPayment')}</Button>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

// ========== 发票信息 ==========

export function InvoiceSection() {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const invoiceData = {
    companyName: '上海出海鲸科技有限公司',
    taxId: '91310000XXXXXXXXXX',
    address: '上海市浦东新区张江高科技园区XX路XX号',
    phone: '+86 21-XXXXXXXX',
    email: 'finance@chujingtech.com',
    bankName: '中国工商银行上海浦东分行',
    bankAccount: '1001 XXXX XXXX 1234 567'
  };

  return (
    <Card
      title={<><FileTextOutlined /> {t('subscription.invoice')}</>}
      extra={
        <Button icon={<EditOutlined />} onClick={() => { setEditing(!editing); if (!editing) form.setFieldsValue(invoiceData); }}>
          {editing ? t('common.cancel') : t('common.edit')}
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      {!editing ? (
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          <Descriptions.Item label={t('subscription.companyName')}>{invoiceData.companyName}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.taxId')}>{invoiceData.taxId}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.address')}>{invoiceData.address}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.phone')}><PhoneOutlined /> {invoiceData.phone}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.email')}><MailOutlined /> {invoiceData.email}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.bankName')}><BankOutlined /> {invoiceData.bankName}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.bankAccount')}>{invoiceData.bankAccount}</Descriptions.Item>
          <Descriptions.Item label={t('subscription.invoiceType')}><Tag color="blue">{t('subscription.vatSpecial')}</Tag></Descriptions.Item>
        </Descriptions>
      ) : (
        <Form form={form} layout="vertical" onFinish={() => { message.success(t('subscription.invoiceSaved')); setEditing(false); }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.companyName')} name="companyName" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.taxId')} name="taxId" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24}><Form.Item label={t('subscription.address')} name="address"><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.phone')} name="phone"><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.email')} name="email"><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.bankName')} name="bankName"><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label={t('subscription.bankAccount')} name="bankAccount"><Input /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit">{t('common.save')}</Button>
        </Form>
      )}
    </Card>
  );
}

// ========== 对公打款信息 ==========

export function BankTransferInfoSection() {
  const { t } = useI18n();

  return (
    <Card title={<><BankOutlined /> {t('subscription.bankTransferInfo')}</>} style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col xs={24} lg={14}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('subscription.beneficiary')}>{t('subscription.beneficiaryName')}</Descriptions.Item>
            <Descriptions.Item label={t('subscription.bankName')}>AllMall Inc.</Descriptions.Item>
            <Descriptions.Item label={t('subscription.bankAddress')}>123 Tech Park Drive, Suite 400, San Francisco, CA 94105</Descriptions.Item>
            <Descriptions.Item label="SWIFT Code">ARKSUS6L</Descriptions.Item>
            <Descriptions.Item label={t('subscription.accountNumber')}>8844 1234 5678 9012</Descriptions.Item>
            <Descriptions.Item label="Routing (ACH)">121000248</Descriptions.Item>
          </Descriptions>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" className="panel-soft full-height">
            <Typography.Title level={5}>{t('subscription.transferNote')}</Typography.Title>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#64748b', fontSize: 13 }}>
              <li>{t('subscription.transferNote1')}</li>
              <li>{t('subscription.transferNote2')}</li>
              <li>{t('subscription.transferNote3')}</li>
              <li>{t('subscription.transferNote4')}</li>
            </ul>
            <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
              {t('subscription.transferNote5')}
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

// ========== 企业解决方案 ==========

export function PrivateDeploySection() {
  const { t } = useI18n();
  return (
    <Card
      title={<><SafetyCertificateOutlined /> {t('subscription.privateDeploy')}</>}
      className="section-card subscription-private-card"
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-primary" style={{ borderLeft: '3px solid #2563eb', height: '100%' }}>
            <div className="stat-card-icon"><BankOutlined /></div>
            <Typography.Title level={5}>{t('subscription.privateDeployTitle')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t('subscription.privateDeployDesc')}
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-purple" style={{ borderLeft: '3px solid #7c3aed', height: '100%' }}>
            <div className="stat-card-icon"><RocketOutlined /></div>
            <Typography.Title level={5}>{t('subscription.agentCustom')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t('subscription.agentCustomDesc')}
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-success" style={{ borderLeft: '3px solid #0f766e', height: '100%' }}>
            <div className="stat-card-icon"><CrownOutlined /></div>
            <Typography.Title level={5}>{t('subscription.modelCustom')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t('subscription.modelCustomDesc')}
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
      <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-warning" style={{ borderLeft: '3px solid #ea580c', height: '100%' }}>
            <div className="stat-card-icon"><TeamOutlined /></div>
            <Typography.Title level={5}>{t('subscription.premiumSupport')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t('subscription.premiumSupportDesc')}
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-card-success" style={{ borderLeft: '3px solid #16a34a', height: '100%' }}>
            <div className="stat-card-icon"><ShopOutlined /></div>
            <Typography.Title level={5}>{t('subscription.dataIsolation')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t('subscription.dataIsolationDesc')}
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 8px' }}>
            <div>
              <Typography.Text>{t('subscription.contactSales')}</Typography.Text>
              <br />
              <Typography.Text strong style={{ fontSize: 16 }}>enterprise@allmall.com</Typography.Text>
              <br />
              <Typography.Text type="secondary">{t('subscription.contactSalesPhone')}</Typography.Text>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
