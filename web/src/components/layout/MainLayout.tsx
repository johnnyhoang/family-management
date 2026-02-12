import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className="pl-64 p-8 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
