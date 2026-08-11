import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const CSS_VARS: Record<string, string> = {
  '--app-primary': '#4F46E5',
  '--app-primary-hover': '#4338CA',
  '--app-primary-bg': '#EEF2FF',
  '--app-success': '#10B981',
  '--app-success-bg': '#ECFDF5',
  '--app-warning': '#F59E0B',
  '--app-warning-bg': '#FFFBEB',
  '--app-danger': '#EF4444',
  '--app-danger-bg': '#FEF2F2',
  '--app-info': '#3B82F6',
  '--app-info-bg': '#EFF6FF',
  '--app-bg-page': '#F1F5F9',
  '--app-bg-card': '#FFFFFF',
  '--app-bg-elevated': '#FFFFFF',
  '--app-bg-sidebar': '#0F172A',
  '--app-bg-sidebar-hover': '#1E293B',
  '--app-bg-sidebar-active': '#1E293B',
  '--app-sidebar-text': '#94A3B8',
  '--app-sidebar-text-active': '#FFFFFF',
  '--app-border': '#E2E8F0',
  '--app-border-light': '#F1F5F9',
  '--app-text': '#0F172A',
  '--app-text-secondary': '#475569',
  '--app-text-tertiary': '#94A3B8',
  '--app-radius': '6px',
  '--app-radius-lg': '8px',
  '--app-shadow-sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
  '--app-shadow': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  '--app-shadow-md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  '--app-stat-blue': '#818CF8',
  '--app-stat-green': '#34D399',
  '--app-stat-orange': '#FBBF24',
  '--app-stat-red': '#F87171',
  '--app-stat-purple': '#A78BFA',
};

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--app-bg-page);
    color: var(--app-text);
  }
  .ant-layout { background: transparent !important; }
  .ant-card {
    border: 1px solid var(--app-border) !important;
    border-radius: var(--app-radius-lg) !important;
    box-shadow: var(--app-shadow-sm) !important;
  }
  .ant-card-head {
    border-bottom: 1px solid var(--app-border-light) !important;
    min-height: 48px !important;
  }
  .ant-card-head-title { font-size: 14px !important; font-weight: 600 !important; }
  .ant-table {
    font-size: 13px !important;
  }
  .ant-table-thead > tr > th {
    background: var(--app-bg-page) !important;
    color: var(--app-text-secondary) !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    text-transform: none !important;
    border-bottom: 1px solid var(--app-border) !important;
    padding: 10px 12px !important;
  }
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--app-border-light) !important;
    padding: 10px 12px !important;
  }
  .ant-table-tbody > tr:hover > td { background: #F8FAFC !important; }
  .ant-tag {
    border-radius: 4px !important;
    font-size: 12px !important;
    line-height: 20px !important;
    padding: 0 8px !important;
  }
  .ant-btn { border-radius: var(--app-radius) !important; font-size: 13px !important; }
  .ant-btn-sm { font-size: 12px !important; }
  .ant-select-selector, .ant-input, .ant-picker { border-radius: var(--app-radius) !important; }
  .ant-segmented { border-radius: var(--app-radius) !important; }
  .ant-progress-bg { border-radius: 100px !important; }
  .ant-badge-count { font-size: 10px !important; min-width: 16px !important; height: 16px !important; line-height: 16px !important; }
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const cssVarsStyle: React.CSSProperties = {};
  for (const [key, value] of Object.entries(CSS_VARS)) {
    (cssVarsStyle as Record<string, string>)[key] = value;
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = BASE_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#3B82F6',
          borderRadius: 6,
          fontSize: 13,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorBgContainer: '#FFFFFF',
          colorBorder: '#E2E8F0',
          colorBorderSecondary: '#F1F5F9',
          colorText: '#0F172A',
          colorTextSecondary: '#475569',
          colorTextTertiary: '#94A3B8',
          colorFillAlter: '#F8FAFC',
          paddingContentHorizontal: 16,
          paddingContentVertical: 12,
          controlHeight: 32,
          lineHeight: 1.5,
        },
        components: {
          Menu: {
            itemBorderRadius: 6,
            itemHeight: 36,
            iconSize: 16,
            fontSize: 13,
          },
          Table: {
            headerBg: '#F1F5F9',
            headerColor: '#475569',
            rowHoverBg: '#F8FAFC',
            borderColor: '#E2E8F0',
            cellPaddingBlock: 10,
            cellPaddingInline: 12,
          },
          Card: {
            paddingLG: 20,
          },
          Button: {
            primaryShadow: 'none',
          },
          Select: {
            optionFontSize: 13,
          },
          Input: {
            paddingBlock: 6,
          },
        },
      }}
      locale={zhCN}
    >
      <div style={cssVarsStyle}>{children}</div>
    </ConfigProvider>
  );
}
