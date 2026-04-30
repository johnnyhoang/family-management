import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { ExpenseList } from './pages/ExpenseList';
import { MemberList } from './pages/MemberList';
import { CategoryList } from './pages/CategoryList';
import { Login } from './pages/Login';
import { LoginSuccess } from './pages/LoginSuccess';
import { Settings } from './pages/Settings';
import { CalendarPage } from './pages/CalendarPage';
import { AuthGuard } from './components/auth/AuthGuard';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#f97370',
            colorSuccess: '#68b98a',
            colorWarning: '#f3b665',
            colorInfo: '#7cb7ef',
            borderRadius: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
            colorBgContainer: '#fffdfb',
            colorTextBase: '#2d2a26',
            colorBorderSecondary: '#f2d7c7',
          },
          components: {
            Button: {
              borderRadius: 12,
              controlHeight: 38,
              fontWeight: 600,
            },
            Table: {
              borderRadiusLG: 14,
              headerBg: '#fff5ee',
            },
            Modal: {
              borderRadiusLG: 18,
            },
            Input: {
              controlHeight: 38,
            },
            Select: {
              controlHeight: 38,
            },
            DatePicker: {
              controlHeight: 38,
            },
          }
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-success" element={<LoginSuccess />} />

            <Route element={<AuthGuard />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="assets" element={<AssetList />} />
                <Route path="expenses" element={<ExpenseList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="members" element={<MemberList />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
