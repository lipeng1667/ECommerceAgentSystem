/**
 * Quick Reply Panel — V1.0 Customer Service.
 * Collapsible drawer with categorized quick-reply templates.
 */
import { ThunderboltOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import { Input, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { useI18n } from '../../app/i18n';
import type { QuickReplyTemplate } from '../../types/domain';

interface Props {
  templates: QuickReplyTemplate[];
  onSelect: (template: QuickReplyTemplate) => void;
}

const CATEGORY_LABELS: Record<QuickReplyTemplate['category'], string> = {
  greeting: 'cs.qrGreeting',
  after_sales: 'cs.qrAfterSales',
  logistics: 'cs.qrLogistics',
  refund: 'cs.qrRefund',
  general: 'cs.qrGeneral',
};

export function QuickReplyPanel({ templates, onSelect }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = search
    ? templates.filter((tmpl) => tmpl.text.toLowerCase().includes(search.toLowerCase()))
    : templates;

  const categories = [...new Set(filtered.map((tmpl) => tmpl.category))];

  return (
    <div style={{
      width: 280, borderLeft: '1px solid var(--ark-border-soft)',
      display: 'flex', flexDirection: 'column', background: 'var(--ark-bg-sink)',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ark-border-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ThunderboltOutlined style={{ color: 'var(--ark-purple)' }} />
        <Typography.Text strong style={{ fontSize: 12 }}>{t('cs.quickReplies')}</Typography.Text>
      </div>
      <Input
        prefix={<SearchOutlined />}
        placeholder={t('cs.searchReplies')}
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ margin: 8, width: 'calc(100% - 16px)' }}
        allowClear
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {search ? (
          filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => onSelect(tmpl)}
              style={{
                padding: '6px 8px', marginBottom: 4, borderRadius: 4, cursor: 'pointer',
                fontSize: 12, lineHeight: '18px',
                border: '1px solid var(--ark-border-soft)',
                background: 'var(--ark-bg-surface)',
              }}
            >
              {tmpl.text}
            </div>
          ))
        ) : (
          categories.map((cat) => {
            const items = filtered.filter((tmpl) => tmpl.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4, paddingLeft: 4 }}>
                  {t(CATEGORY_LABELS[cat])}
                </Typography.Text>
                {items.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => onSelect(tmpl)}
                    style={{
                      padding: '6px 8px', marginBottom: 4, borderRadius: 4, cursor: 'pointer',
                      fontSize: 12, lineHeight: '18px',
                      border: '1px solid var(--ark-border-soft)',
                      background: 'var(--ark-bg-surface)',
                    }}
                  >
                    {tmpl.text}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
