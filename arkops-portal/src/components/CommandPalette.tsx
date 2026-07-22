/**
 * File: CommandPalette.tsx
 * Purpose: Cmd/Ctrl+K quick-search palette (UX finding 4.9, WS-E stretch E8).
 * Searches live stores, agents, and pending approvals plus page shortcuts
 * (orders, products, …) and navigates on selection. Order-record search will
 * plug in once an orders API exists (order rows currently live inside the
 * orders page, owned by WS-C).
 *
 * Author: Michael Lee
 * Created: 2026-07-22 (WS-E, E8)
 *
 * Main exports:
 * - CommandPalette: self-contained overlay; mounts once in AppShell and
 *   registers its own global Cmd/Ctrl+K listener.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  CompassOutlined,
  RobotOutlined,
  SearchOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Input, Modal, Tag, Typography } from 'antd';
import type { InputRef } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { agentsApi } from '../api/agents';
import { approvalsApi } from '../api/approvals';
import { storesApi } from '../api/stores';
import { useI18n } from '../app/i18n';

interface PaletteResult {
  key: string;
  group: string;
  icon: ReactNode;
  title: string;
  meta?: string;
  path: string;
}

const MAX_PER_GROUP = 5;

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

/**
 * Global quick-search palette opened by Cmd/Ctrl+K or the header search button.
 * Keyboard: ArrowUp/ArrowDown to move, Enter to open, Esc to close.
 *
 * @param open - Controlled visibility state (owned by AppShell).
 * @param onOpenChange - Called with the next visibility state.
 */
export function CommandPalette({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after the modal content mounts.
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', 'palette'],
    queryFn: storesApi.list,
    enabled: open
  });
  const { data: agents = [] } = useQuery({
    queryKey: ['agents', 'palette'],
    queryFn: agentsApi.list,
    enabled: open
  });
  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals', 'palette'],
    queryFn: approvalsApi.list,
    enabled: open
  });

  const pageShortcuts = useMemo(
    () => [
      { title: t('nav.dashboard'), path: '/dashboard' },
      { title: t('nav.orders'), path: '/orders' },
      { title: t('nav.products'), path: '/products' },
      { title: t('nav.storeManagement'), path: '/stores' },
      { title: t('nav.agentManagement'), path: '/agents' },
      { title: t('nav.approvalCenter'), path: '/agents/approvals' },
      { title: t('nav.exceptionCenter'), path: '/agents/exceptions' },
    ],
    [t]
  );

  const results = useMemo<PaletteResult[]>(() => {
    const list: PaletteResult[] = [];
    const hasQuery = query.trim().length > 0;

    const pages = hasQuery
      ? pageShortcuts.filter((page) => matches(query, page.title))
      : pageShortcuts;
    pages.slice(0, MAX_PER_GROUP + 2).forEach((page) =>
      list.push({
        key: `page-${page.path}`,
        group: t('shell.searchGroupPages'),
        icon: <CompassOutlined />,
        title: page.title,
        path: page.path
      })
    );

    if (hasQuery) {
      stores
        .filter((store) => matches(query, store.name, store.platform))
        .slice(0, MAX_PER_GROUP)
        .forEach((store) =>
          list.push({
            key: `store-${store.id}`,
            group: t('shell.searchGroupStores'),
            icon: <ShopOutlined />,
            title: store.name,
            meta: store.platform,
            path: `/stores/${store.id}`
          })
        );

      agents
        .filter((agent) => matches(query, agent.displayName, agent.agentType, agent.description))
        .slice(0, MAX_PER_GROUP)
        .forEach((agent) =>
          list.push({
            key: `agent-${agent.agentType}`,
            group: t('shell.searchGroupAgents'),
            icon: <RobotOutlined />,
            title: agent.displayName,
            meta: agent.agentType,
            path: `/agents/${agent.agentType}`
          })
        );

      approvals
        .filter(
          (approval) =>
            approval.status === 'pending' &&
            matches(query, approval.title, approval.storeName, String(approval.id))
        )
        .slice(0, MAX_PER_GROUP)
        .forEach((approval) =>
          list.push({
            key: `approval-${approval.id}`,
            group: t('shell.searchGroupApprovals'),
            icon: <CheckSquareOutlined />,
            title: approval.title,
            meta: approval.storeName,
            path: `/agents/approvals/${approval.id}`
          })
        );
    }

    return list;
  }, [query, pageShortcuts, stores, agents, approvals, t]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (result: PaletteResult) => {
    onOpenChange(false);
    navigate(result.path);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  let lastGroup = '';

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      closable={false}
      width={560}
      className="command-palette"
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      <div className="command-palette-input">
        <Input
          ref={inputRef}
          size="large"
          variant="borderless"
          prefix={<SearchOutlined />}
          placeholder={t('shell.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          allowClear
        />
      </div>
      <div className="command-palette-results" role="listbox">
        {results.length === 0 ? (
          <div className="command-palette-empty">
            <AppstoreOutlined /> {t('shell.searchEmpty')}
          </div>
        ) : (
          results.map((result, index) => {
            const showGroup = result.group !== lastGroup;
            lastGroup = result.group;
            return (
              <div key={result.key}>
                {showGroup && (
                  <Typography.Text type="secondary" className="command-palette-group">
                    {result.group}
                  </Typography.Text>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`command-palette-item${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(result)}
                >
                  {result.icon}
                  <span className="command-palette-item-title">{result.title}</span>
                  {result.meta && <Tag className="command-palette-item-meta">{result.meta}</Tag>}
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="command-palette-footer">
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {t('shell.searchHint')}
        </Typography.Text>
      </div>
    </Modal>
  );
}
