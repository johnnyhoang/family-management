import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { ExpenseList } from './pages/ExpenseList';
import { MemberList } from './pages/MemberList';
import { CategoryList } from './pages/CategoryList';
import './index.css';
import './i18n';

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
            colorPrimary: '#0ea5e9',
            borderRadius: 8,
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetList />} />
              <Route path="expenses" element={<ExpenseList />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="members" element={<MemberList />} />
              <Route path="settings" element={<div>Settings Page</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
