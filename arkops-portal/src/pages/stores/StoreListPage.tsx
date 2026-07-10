import { ApiOutlined, CustomerServiceOutlined, DollarOutlined, PlusOutlined, ShoppingCartOutlined, ThunderboltOutlined, WalletOutlined, WifiOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import { storesApi } from '../../api/stores';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import { DataTableCard } from '../../components/table/DataTableCard';
import type { Store } from '../../types/domain';

const serviceIcons: Record<string, JSX.Element> = {
  advertising: <ThunderboltOutlined />,
  customer_service: <CustomerServiceOutlined />,
  logistics: <ShoppingCartOutlined />,
  finance: <WalletOutlined />,
  other: <ApiOutlined />
};

const gmvByStoreName: Record<string, number> = {
  'TikTok Shop 美国旗舰店': 12450,
  'Amazon 户外用品店': 8920,
  'Shopify 独立站': 3210
};

const ordersByStoreName: Record<string, number> = {
  'TikTok Shop 美国旗舰店': 186,
  'Amazon 户外用品店': 134,
  'Shopify 独立站': 92
};

const sessionHealthColor: Record<string, string> = {
  connected: 'green',
  login_required: 'red',
  pending_login: 'orange',
  expired: 'red',
  revoked: 'default'
};

function sessionTag(status: string): JSX.Element {
  if (status === 'connected') return <Tag color="green">Active</Tag>;
  if (status === 'login_required') return <Tag color="red">Expired</Tag>;
  if (status === 'pending_login') return <Tag color="orange">Pending</Tag>;
  return <Tag>Unknown</Tag>;
}

export function StoreListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data = [] } = useQuery({ queryKey: ['stores'], queryFn: storesApi.list });

  const columns: ColumnsType<Store> = [
    { title: t('stores.store'), dataIndex: 'name', render: (name, record) => <Link to={`/stores/${record.id}`}>{name}</Link> },
    { title: t('stores.platform'), dataIndex: 'platform' },
    { title: t('stores.authMethod'), dataIndex: 'authMethod', render: (method: Store['authMethod']) => {
      const map: Record<string, string> = { credentials: t('stores.authCredentials'), api_key: t('stores.authApiKey'), oauth: t('stores.authOauth') };
      return <Tag>{map[method] ?? method}</Tag>;
    }},
    { title: t('stores.todayGmv'), dataIndex: 'name', render: (name: string) => {
      const gmv = gmvByStoreName[name];
      return <span><DollarOutlined style={{ marginRight: 4, color: '#16a34a' }} />${gmv != null ? gmv.toLocaleString() : '-'}</span>;
    }},
    { title: t('stores.todayOrders'), dataIndex: 'name', width: 80, render: (name: string) => {
      const orders = ordersByStoreName[name];
      return <span><ShoppingCartOutlined style={{ marginRight: 4, color: '#2563eb' }} />{orders ?? '-'}</span>;
    }},
    { title: <><WifiOutlined /> {t('stores.session')}</>, dataIndex: 'status', render: (_status: string, record: Store) => (
      <Space size={4}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: sessionHealthColor[record.status] === 'green' ? '#16a34a' : sessionHealthColor[record.status] === 'red' ? '#dc2626' : sessionHealthColor[record.status] === 'orange' ? '#ea580c' : '#94a3b8',
          flexShrink: 0
        }} />
        {sessionTag(record.status)}
      </Space>
    )},
    {
      title: t('stores.enabledServices'),
      dataIndex: 'connections',
      render: (connections: Store['connections']) => {
        if (!connections || connections.length === 0) return <Typography.Text type="secondary">-</Typography.Text>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {connections.map((c) => (
              <Tag key={c.id} icon={serviceIcons[c.serviceType] ?? <ApiOutlined />}>
                {c.serviceName}
              </Tag>
            ))}
          </div>
        );
      }
    }
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title={t('stores.title')}
        description={t('stores.description')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stores/new')}>
            {t('stores.add')}
          </Button>
        }
      />
      <DataTableCard<Store>
        rowKey="id"
        columns={columns}
        dataSource={data}
        scroll={{ x: 1100 }}
      />
    </div>
  );
}
