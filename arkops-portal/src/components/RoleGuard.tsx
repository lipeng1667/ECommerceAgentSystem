import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { canAccess } from '../app/rolePermissions';
import { useI18n } from '../app/i18n';
import type { PropsWithChildren } from 'react';

/**
 * Wraps a route element to enforce role-based access control.
 * If the current user's role cannot access the route, shows Access Denied.
 */
export function RoleGuard({ path, children }: PropsWithChildren<{ path: string }>) {
  const { role } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  if (!role || !canAccess(role, path)) {
    return (
      <Result
        status="403"
        title={t('role.accessDenied')}
        subTitle={t('role.noPermissionDesc')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('role.backToDashboard')}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
