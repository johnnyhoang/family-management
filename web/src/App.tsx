import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antTheme } from 'antd';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard } from './components/auth/AuthGuard';
import { SessionProvider, useSession } from './components/auth/SessionProvider';
import { ThemeProvider, useThemeMode } from './components/theme/ThemeProvider';
import './index.css';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const AssetList = lazy(() => import('./pages/AssetList').then((module) => ({ default: module.AssetList })));
const ExpenseList = lazy(() => import('./pages/ExpenseList').then((module) => ({ default: module.ExpenseList })));
const MemberList = lazy(() => import('./pages/MemberList').then((module) => ({ default: module.MemberList })));
const CategoryList = lazy(() => import('./pages/CategoryList').then((module) => ({ default: module.CategoryList })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const LoginSuccess = lazy(() => import('./pages/LoginSuccess').then((module) => ({ default: module.LoginSuccess })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then((module) => ({ default: module.AdminPanel })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const { themeMode } = useThemeMode();
  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#ff988a' : '#f97370',
          colorSuccess: isDark ? '#7acc98' : '#68b98a',
          colorWarning: isDark ? '#f2c77b' : '#f3b665',
          colorInfo: isDark ? '#8dbfff' : '#7cb7ef',
          borderRadius: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
          colorBgContainer: isDark ? '#1f2431' : '#fffdfb',
          colorTextBase: isDark ? '#f5eef2' : '#2d2a26',
          colorBorderSecondary: isDark ? '#424a60' : '#f2d7c7',
        },
        components: {
          Button: {
            borderRadius: 12,
            controlHeight: 38,
            fontWeight: 600,
          },
          Table: {
            borderRadiusLG: 14,
            headerBg: isDark ? '#2b3244' : '#fff5ee',
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
        },
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-success" element={<LoginSuccess />} />

            <Route element={<AuthGuard />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="assets" element={<ProtectedPage moduleKey="ASSET"><AssetList /></ProtectedPage>} />
                <Route path="expenses" element={<ProtectedPage moduleKey="TRANSACTION"><ExpenseList /></ProtectedPage>} />
                <Route path="categories" element={<ProtectedPage moduleKey="CATEGORY"><CategoryList /></ProtectedPage>} />
                <Route path="members" element={<ProtectedPage moduleKey="USER"><MemberList /></ProtectedPage>} />
                <Route path="calendar" element={<ProtectedPage moduleKey="CALENDAR"><CalendarPage /></ProtectedPage>} />
                <Route path="admin" element={<ProtectedPage moduleKey="ADMIN"><AdminPanel /></ProtectedPage>} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

const RouteLoading = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
    Đang tải phiên làm việc...
  </div>
);

const PageFallback = () => (
  <div className="min-h-[30vh] flex items-center justify-center text-slate-500">
    Đang tải giao diện...
  </div>
);

function HomePage() {
  const { isLoading, canAccess, activeFamilyId } = useSession();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (activeFamilyId && canAccess('DASHBOARD', 'view')) {
    return <Dashboard />;
  }

  if (canAccess('ADMIN', 'view')) {
    return <AdminPanel />;
  }

  return <Settings />;
}

function ProtectedPage({
  moduleKey,
  children,
}: {
  moduleKey: Parameters<ReturnType<typeof useSession>['canAccess']>[0];
  children: React.ReactNode;
}) {
  const { isLoading, canAccess } = useSession();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!canAccess(moduleKey, 'view')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default App;
