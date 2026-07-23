/**
 * File: FocusedLayout.tsx
 * Purpose: Minimal, auth-protected chrome for immersive single-task flows
 * (currently the store onboarding / migration wizard). It deliberately hides the
 * global navigation menu, store scope, search, and notifications so a first-time
 * merchant focuses on the one task at hand — connecting their store. Only the
 * brand, theme toggle, and a save-and-exit action remain.
 *
 * Author: Michael Lee
 *
 * Main exports:
 * - FocusedLayout: layout wrapper rendered by the router for focused flows.
 *
 * Major updates:
 * - 2026-07-23: Created to give the onboarding wizard a distraction-free shell
 *   instead of rendering it inside the full AppShell (double-nav problem).
 */
import { DesktopOutlined, LogoutOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Layout, Segmented, Space } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

const { Header, Content } = Layout;

/**
 * Distraction-free frame for focused flows. Progress and step navigation are
 * owned by the page rendered in the outlet; this shell only provides brand,
 * theme switching, and a save-and-exit escape hatch back to the app.
 */
export function FocusedLayout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { mode, setMode } = useTheme();

  return (
    <Layout className="focused-layout">
      <Header className="focused-header">
        <div className="focused-brand">
          <div className="focused-brand-mark">A</div>
          <div className="focused-brand-copy">
            <span className="focused-brand-name">AllMall</span>
            <span className="focused-brand-sub">{t('app.subtitle')}</span>
          </div>
        </div>
        <Space size={8}>
          <Segmented
            size="small"
            value={mode}
            onChange={(value) => setMode(value as 'system' | 'light' | 'dark')}
            options={[
              { label: <span title={t('theme.system')}><DesktopOutlined /></span>, value: 'system' },
              { label: <span title={t('theme.light')}><SunOutlined /></span>, value: 'light' },
              { label: <span title={t('theme.dark')}><MoonOutlined /></span>, value: 'dark' },
            ]}
          />
          <Button icon={<LogoutOutlined />} onClick={() => navigate('/stores')}>
            {t('focused.saveExit')}
          </Button>
        </Space>
      </Header>
      <Content className="focused-content">
        <Outlet />
      </Content>
    </Layout>
  );
}
