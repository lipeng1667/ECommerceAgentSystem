import { Card, Skeleton } from 'antd';

/**
 * Dashboard loading skeleton.
 * Mirrors the Dashboard layout: status bar + metrics + chart + table.
 */
export function DashboardSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton.Input active size="large" style={{ width: 300, marginBottom: 16 }} />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Card size="small" style={{ flex: 2 }}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      </div>
      <Card size="small">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    </div>
  );
}

/**
 * Agent list loading skeleton.
 * Mirrors the Agent list layout: header + grid of agent cards.
 */
export function AgentListSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton.Input active size="large" style={{ width: 300, marginBottom: 16 }} />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Table page loading skeleton (for orders, products, etc.).
 */
export function TablePageSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton.Input active size="large" style={{ width: 300, marginBottom: 16 }} />
      <Card size="small">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
}
