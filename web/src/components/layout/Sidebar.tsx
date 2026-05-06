import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import {
    LayoutDashboard,
    Package,
    Receipt,
    Settings,
    LogOut,
    X,
    CalendarDays,
    ShieldCheck,
    Wrench,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSession } from '../auth/SessionProvider';

const navigation = [
    { name: 'Tổng quan', href: '/', icon: LayoutDashboard, moduleKey: 'DASHBOARD' as const },
    { name: 'Quản lý tài sản', href: '/assets', icon: Package, moduleKey: 'ASSET' as const },
    { name: 'Bảo trì tài sản', href: '/maintenance', icon: Wrench, moduleKey: 'ASSET' as const },
    { name: 'Quản lý tài chính', href: '/expenses', icon: Receipt, moduleKey: 'TRANSACTION' as const },
    { name: 'Lịch gia đình', href: '/calendar', icon: CalendarDays, moduleKey: 'CALENDAR' as const },
    { name: 'Quản trị hệ thống', href: '/admin', icon: ShieldCheck, moduleKey: 'ADMIN' as const },
    { name: 'Thiết lập', href: '/settings', icon: Settings, moduleKey: null },
];

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
    const navigate = useNavigate();
    const {
        activeFamilyId,
        activeFamilyName,
        memberships,
        role,
        systemRole,
        canAccess,
        switchFamily,
        isSwitchingFamily,
    } = useSession();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        onClose?.();
    };

    const visibleNavigation = navigation.filter((item) => item.moduleKey === null || canAccess(item.moduleKey, 'view'));

    const roleLabel = systemRole === 'APP_ADMIN'
        ? `Quản trị ứng dụng${role && role !== 'APP_ADMIN' ? ` · ${role === 'FAMILY_ADMIN' ? 'Quản trị gia đình' : 'Thành viên'}` : ''}`
        : role === 'FAMILY_ADMIN'
            ? 'Quản trị gia đình'
            : 'Thành viên';

    return (
        <aside className="w-64 h-screen flex flex-col p-3 relative bg-[linear-gradient(180deg,rgba(255,251,247,0.96),rgba(255,245,239,0.92))] border-r border-[rgba(242,214,197,0.75)] shadow-[18px_0_50px_rgba(227,188,165,0.12)] backdrop-blur-md">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 lg:hidden text-[#9f7d6e] hover:text-[#7e5f52] hover:bg-white rounded-xl transition-colors"
                aria-label="Đóng thanh bên"
            >
                <X size={20} />
            </button>

            <Link
                to="/"
                onClick={() => onClose?.()}
                className="mb-4 rounded-[18px] border border-white/80 bg-white/70 px-3 py-3 outline-offset-2 shadow-[0_12px_28px_rgba(237,200,183,0.18)] hover:opacity-95 transition-opacity"
            >
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.svg"
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-2xl shadow-lg shadow-[#f7b5a3]/30 shrink-0"
                    />
                    <div>
                        <h1 className="font-bold text-base text-[#4f3f37] tracking-tight">Tài sản Gia đình</h1>
                        <p className="text-xs text-[#8c6d61]">Gọn gàng, ấm áp, dễ theo dõi</p>
                    </div>
                </div>
                <img
                    src="/family-soft-illustration.svg"
                    alt=""
                    className="mt-2 h-20 w-full rounded-2xl object-cover"
                />
            </Link>

            <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="cute-chip">Nhẹ mắt</span>
                <span className="cute-chip">Dễ dùng</span>
                <span className="cute-chip">Gia đình</span>
            </div>

            <div className="mb-3 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-[0_10px_24px_rgba(237,200,183,0.12)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9f7d6e]">Phiên làm việc</p>
                <p className="mt-1 text-sm font-semibold text-[#4f3f37]">{roleLabel}</p>
                {memberships.length > 0 ? (
                    <Select
                        value={activeFamilyId ?? undefined}
                        size="small"
                        className="mt-2 w-full"
                        placeholder="Chọn gia đình"
                        loading={isSwitchingFamily}
                        onChange={(value) => switchFamily(value)}
                        options={memberships.map((membership) => ({
                            value: membership.familyId,
                            label: `${membership.familyName} · ${membership.role === 'FAMILY_ADMIN' ? 'Quản trị' : 'Thành viên'}`,
                        }))}
                    />
                ) : (
                    <p className="mt-2 text-xs text-[#8c6d61]">{activeFamilyName || 'Chưa gắn gia đình hoạt động'}</p>
                )}
            </div>

            <nav className="flex-1 space-y-1.5">
                {visibleNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => onClose?.()}
                        className={({ isActive }) => cn(
                            "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-[#6c5a51] hover:text-[#c85f58] hover:bg-white/80",
                            isActive && "bg-white text-[#c85f58] font-semibold shadow-[0_10px_24px_rgba(235,189,168,0.18)] border border-[rgba(247,208,190,0.8)]"
                        )}
                    >
                        <span className={cn(
                            "flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-white/80 text-[#d37a6b] shadow-sm",
                            "group-hover:bg-[#fff3ed]"
                        )}>
                            <item.icon size={16} />
                        </span>
                        <span className="text-[14px] leading-tight">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="mt-auto flex items-center justify-center p-2.5 rounded-xl text-[#cf675f] hover:bg-white/85 w-full group transition-colors border border-transparent hover:border-[rgba(244,206,190,0.75)]"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-[#cf675f] shadow-sm">
                    <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </span>
            </button>
        </aside>
    );
};
