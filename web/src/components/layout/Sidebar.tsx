import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Package,
    Receipt,
    Users,
    Settings,
    LogOut,
    FolderTree,
    X,
    CalendarDays
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
    { name: 'sidebar.dashboard', href: '/', icon: LayoutDashboard },
    { name: 'sidebar.assets', href: '/assets', icon: Package },
    { name: 'sidebar.expenses', href: '/expenses', icon: Receipt },
    { name: 'sidebar.categories', href: '/categories', icon: FolderTree },
    { name: 'sidebar.calendar', href: '/calendar', icon: CalendarDays },
    { name: 'sidebar.members', href: '/members', icon: Users },
    { name: 'sidebar.settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        onClose?.();
    };

    return (
        <aside className="w-64 glass-card h-screen flex flex-col p-4 relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
            >
                <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200">FA</div>
                <h1 className="font-bold text-lg text-slate-800 tracking-tight">FamilyAsset</h1>
            </div>

            <nav className="flex-1 space-y-1">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => onClose?.()}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-slate-600 hover:text-primary-600 hover:bg-primary-50",
                            isActive && "bg-primary-50 text-primary-600 font-medium shadow-sm"
                        )}
                    >
                        <item.icon size={20} />
                        <span>{t(item.name)}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 mt-auto w-full group transition-colors"
            >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Đăng xuất</span>
            </button>
        </aside>
    );
};
