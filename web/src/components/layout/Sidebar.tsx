import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Select, Modal, Form, Input, Button, Tooltip } from 'antd';
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
    Plus,
    Users,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSession } from '../auth/SessionProvider';
import { getFamilyRoleDescription, APP_ADMIN_DESCRIPTION } from '../../utils/roleDescriptions';

const navigation = [
    { name: 'Tổng quan', href: '/', icon: LayoutDashboard, moduleKey: 'DASHBOARD' as const },
    { name: 'Quản lý tài sản', href: '/assets', icon: Package, moduleKey: 'ASSET' as const },
    { name: 'Bảo trì khai thác và nợ', href: '/maintenance', icon: Wrench, moduleKey: 'ASSET' as const },
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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form] = Form.useForm();
    const {
        activeFamilyId,
        activeFamilyName,
        memberships,
        role,
        systemRole,
        canAccess,
        switchFamily,
        isSwitchingFamily,
        createFamily,
        isCreatingFamily,
    } = useSession();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        onClose?.();
    };

    const handleCreateFamily = async (values: { name: string }) => {
        await createFamily(values.name);
        setIsCreateModalOpen(false);
        form.resetFields();
    };

    const visibleNavigation = navigation.filter((item) => item.moduleKey === null || canAccess(item.moduleKey, 'view'));

    const roleLabel = systemRole === 'APP_ADMIN'
        ? `Quản trị ứng dụng${role && role !== 'APP_ADMIN' ? ` · ${role === 'FAMILY_ADMIN' ? 'Quản trị gia đình' : 'Thành viên'}` : ''}`
        : role === 'FAMILY_ADMIN'
            ? 'Quản trị gia đình'
            : 'Thành viên';

    const roleTooltip = systemRole === 'APP_ADMIN' && role !== 'FAMILY_ADMIN' && role !== 'MEMBER'
        ? APP_ADMIN_DESCRIPTION
        : getFamilyRoleDescription(role === 'FAMILY_ADMIN' || role === 'MEMBER' ? role : null);

    return (
        <aside className="w-64 h-screen flex flex-col p-2 relative bg-[linear-gradient(180deg,rgba(255,251,247,0.96),rgba(255,245,239,0.92))] border-r border-[rgba(242,214,197,0.75)] shadow-[18px_0_50px_rgba(227,188,165,0.12)] backdrop-blur-md">
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
                className="mb-2 rounded-[18px] border border-white/80 bg-white/70 px-2.5 py-2 outline-offset-2 shadow-[0_12px_28px_rgba(237,200,183,0.18)] hover:opacity-95 transition-opacity"
            >
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.svg"
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-2xl shadow-lg shadow-[#f7b5a3]/30 shrink-0"
                    />
                    <div>
                        <h1 className="font-bold text-base text-[#4f3f37] tracking-tight">Tài sản Gia đình</h1>
                    </div>
                </div>
            </Link>

            <div className="mb-2 rounded-2xl border border-white/80 bg-white/70 p-2 shadow-[0_10px_24px_rgba(237,200,183,0.12)]">
                <div className="flex items-center justify-between">
                    <Tooltip title={roleTooltip} placement="bottomLeft">
                        <p className="text-xs font-semibold text-[#4f3f37] underline decoration-dotted decoration-[#c9a894] underline-offset-2 cursor-help">{roleLabel}</p>
                    </Tooltip>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs text-[#c85f58] hover:text-[#b04a43] font-medium transition-colors"
                        title="Tạo gia đình mới"
                    >
                        <Plus size={13} />
                        <span>Tạo mới</span>
                    </button>
                </div>
                {memberships.length > 0 ? (
                    <Select
                        value={activeFamilyId ?? undefined}
                        size="small"
                        className="mt-1 w-full"
                        placeholder="Chọn gia đình"
                        loading={isSwitchingFamily}
                        onChange={(value) => switchFamily(value)}
                        options={memberships.map((membership) => {
                            const isInactive = membership.familyStatus === 'INACTIVE';
                            return {
                                value: membership.familyId,
                                disabled: isInactive,
                                label: `${membership.familyName} · ${membership.role === 'FAMILY_ADMIN' ? 'Quản trị' : 'Thành viên'}${isInactive ? ' · Tạm ngưng' : ''}`,
                            };
                        })}
                    />
                ) : (
                    <div className="mt-1">
                        <p className="text-xs text-[#8c6d61]">{activeFamilyName || 'Chưa có gia đình'}</p>
                        <Button
                            type="dashed"
                            size="small"
                            icon={<Plus size={12} />}
                            className="mt-1 w-full text-xs text-[#c85f58]"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Tạo gia đình đầu tiên
                        </Button>
                    </div>
                )}
            </div>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-base font-bold text-slate-800">
                        <Users size={18} className="text-[#c85f58]" />
                        <span>Tạo Không Gian Gia Đình Mới</span>
                    </div>
                }
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                footer={null}
                centered
                destroyOnClose
            >
                <p className="text-xs text-slate-500 mb-4">
                    Tạo một gia đình mới để quản lý độc lập tài sản, chi tiêu và hồ sơ định cư riêng biệt. Bạn sẽ là Quản trị viên của gia đình này.
                </p>
                <Form form={form} layout="vertical" onFinish={handleCreateFamily}>
                    <Form.Item
                        name="name"
                        label="Tên gia đình"
                        rules={[{ required: true, message: 'Vui lòng nhập tên gia đình' }]}
                    >
                        <Input placeholder="Ví dụ: Gia đình Nguyễn Văn A" size="large" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isCreatingFamily}
                            className="bg-[#c85f58] hover:bg-[#b04a43]"
                        >
                            Tạo gia đình
                        </Button>
                    </div>
                </Form>
            </Modal>

            <nav className="flex-1 space-y-1">
                {visibleNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => onClose?.()}
                        className={({ isActive }) => cn(
                            "group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-[#6c5a51] hover:text-[#c85f58] hover:bg-white/80",
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
                className="mt-auto flex items-center justify-center p-2 rounded-xl text-[#cf675f] hover:bg-white/85 w-full group transition-colors border border-transparent hover:border-[rgba(244,206,190,0.75)]"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-[#cf675f] shadow-sm">
                    <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </span>
            </button>
        </aside>
    );
};
