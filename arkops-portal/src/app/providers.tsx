import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from './auth';
import { DemoModeProvider } from './demoMode';
import { I18nProvider } from './i18n';
import { ThemeProvider, useTheme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false
    }
  }
});

function AntDesignThemeProvider({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          colorBgBase: isDark ? '#0f172a' : '#ffffff',
          colorBgContainer: isDark ? '#111827' : '#ffffff',
          colorBorder: isDark ? '#253247' : '#dbe3ef',
          colorText: isDark ? '#e5eefc' : '#172033',
          colorTextSecondary: isDark ? '#94a3b8' : '#5b6b84'
        },
        components: {
          Card: { borderRadiusLG: 8 },
          Button: { borderRadius: 8 },
          Table: { headerBg: isDark ? '#162033' : '#f8fafc' },
          Layout: {
            bodyBg: isDark ? '#0b1120' : '#f5f7fb',
            headerBg: isDark ? '#111827' : '#ffffff',
            siderBg: isDark ? '#111827' : '#ffffff'
          },
          Menu: {
            itemSelectedBg: isDark ? '#1e3a8a' : '#eff6ff',
            itemSelectedColor: isDark ? '#bfdbfe' : '#2563eb'
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <DemoModeProvider>
        <ThemeProvider>
          <AntDesignThemeProvider>
            <I18nProvider>
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </I18nProvider>
          </AntDesignThemeProvider>
        </ThemeProvider>
      </DemoModeProvider>
    </AuthProvider>
  );
}
