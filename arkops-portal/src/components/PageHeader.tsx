/**
 * File: PageHeader.tsx
 * Purpose: Shared page title row used by route-level pages to keep title, description,
 * and action controls visually consistent.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - PageHeader: renders a standardized page heading with optional actions.
 *
 * Major updates:
 * - 2026-07-03: Added ownership and function documentation for AI-assisted collaboration.
 */
import { memo, type ReactNode } from 'react';
import { Typography } from 'antd';

/**
 * Renders a route-level page heading with optional secondary text and action controls.
 *
 * @param title - Main page title content.
 * @param description - Optional secondary description under the title.
 * @param actions - Optional controls aligned to the right of the title row.
 * @returns React element containing the standard page header.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
export const PageHeader = memo(function PageHeader({
  title,
  description,
  actions
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-title-row">
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      </div>
      {actions}
    </div>
  );
});
