/**
 * File: PageHeader.tsx
 * Purpose: Shared page title row used by route-level pages to keep title, description,
 * and action controls visually consistent. Supports an optional breadcrumb trail and
 * an optional back action for deep detail pages.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - PageHeader: renders a standardized page heading with optional actions.
 * - PageHeaderBreadcrumbItem: breadcrumb node shape consumed by the breadcrumb prop.
 *
 * Major updates:
 * - 2026-07-03: Added ownership and function documentation for AI-assisted collaboration.
 * - 2026-07-22: WS-E — added optional `breadcrumb` and `onBack` props so detail pages
 *   (approvals, stores, agents) can expose a navigation trail and back affordance.
 */
import { memo, type ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useI18n } from '../app/i18n';

/**
 * One node of the PageHeader breadcrumb trail.
 * When `href` is provided the node renders as an in-app router link;
 * otherwise it renders as plain text (typically the current page).
 */
export interface PageHeaderBreadcrumbItem {
  title: ReactNode;
  href?: string;
}

/**
 * Renders a route-level page heading with optional secondary text, action controls,
 * a breadcrumb trail, and a back button.
 *
 * @param title - Main page title content.
 * @param description - Optional secondary description under the title.
 * @param actions - Optional controls aligned to the right of the title row.
 * @param breadcrumb - Optional breadcrumb trail rendered above the title row.
 * @param onBack - Optional handler; when provided a back button renders before the title.
 * @returns React element containing the standard page header.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
export const PageHeader = memo(function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  onBack
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: PageHeaderBreadcrumbItem[];
  onBack?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="page-header">
      {breadcrumb && breadcrumb.length > 0 ? (
        <Breadcrumb
          className="page-header-breadcrumb"
          items={breadcrumb.map((item) => ({
            title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
          }))}
        />
      ) : null}
      <div className="page-title-row">
        <div className="page-title-main">
          {onBack ? (
            <Button
              type="text"
              shape="circle"
              className="page-header-back"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              aria-label={t('shell.back')}
              title={t('shell.back')}
            />
          ) : null}
          <div>
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              {title}
            </Typography.Title>
            {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
});
