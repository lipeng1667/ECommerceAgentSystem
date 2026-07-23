/**
 * Shared store display utilities for AllMall portal.
 *
 * Contains constants and helper functions that were duplicated across
 * StoreListPage and SetupConfigPage. Centralizing them here ensures
 * consistent rendering and reduces maintenance burden.
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

import {
  ApiOutlined,
  CustomerServiceOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type { StoreStatus } from '../types/domain';

/** Platform code → display name mapping — used in store list/detail pages */
export const PLATFORM_NAMES: Record<string, string> = {
  pinduoduo: '拼多多',
  taobao: '淘宝',
  jd: '京东',
};

/** Resolves a platform code to its display name, falling back to the raw code for unknown platforms */
export function getPlatformName(platform: string): string {
  return PLATFORM_NAMES[platform] ?? platform;
}

/** Service type icon mapping — used in store connection lists */
export const SERVICE_ICONS: Record<string, JSX.Element> = {
  advertising: <ThunderboltOutlined />,
  customer_service: <CustomerServiceOutlined />,
  logistics: <ShoppingCartOutlined />,
  finance: <WalletOutlined />,
  other: <ApiOutlined />,
};

/** Session health color mapping — used for store status indicators */
export const SESSION_HEALTH_COLOR: Record<StoreStatus, string> = {
  connected: 'green',
  login_required: 'red',
  pending_login: 'orange',
  expired: 'red',
  revoked: 'default',
};

/** Session status display tag */
export function renderSessionTag(status: StoreStatus): JSX.Element {
  switch (status) {
    case 'connected':
      return <Tag color="green">Active</Tag>;
    case 'login_required':
      return <Tag color="red">Expired</Tag>;
    case 'pending_login':
      return <Tag color="orange">Pending</Tag>;
    case 'expired':
      return <Tag color="red">Expired</Tag>;
    case 'revoked':
      return <Tag>Revoked</Tag>;
    default:
      return <Tag>Unknown</Tag>;
  }
}

/** Session health dot color for inline display */
export function getSessionHealthColor(status: StoreStatus): string {
  return SESSION_HEALTH_COLOR[status];
}
