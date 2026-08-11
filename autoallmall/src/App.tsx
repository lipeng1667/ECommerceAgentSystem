import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { I18nProvider } from './app/i18n';
import { ThemeProvider } from './app/theme';
import { StoreScopeProvider } from './app/storeScope';
import { mockStores } from './mock/data';

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <StoreScopeProvider stores={mockStores}>
          <RouterProvider router={router} />
        </StoreScopeProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
