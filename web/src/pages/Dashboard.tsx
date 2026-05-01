import { useQuery } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    Legend
} from 'recharts';
import { Package, Receipt, AlertTriangle, Clock } from 'lucide-react';
import api from '../api/client';
import { cn } from '../utils/cn';
import { NaturalInputBox } from '../components/NaturalInputBox';
import { useSession } from '../components/auth/SessionProvider';
import { formatVndAmount } from '../utils/currency';
import { getDateBadgeClassName, getMoneyBadgeClassName } from '../utils/display';

const COLORS = ['#f58a7a', '#f3b665', '#7cb7ef', '#7fc7aa', '#f5a6c1', '#b8a5ff'];

export const Dashboard = () => {
    const { systemRole, canAccess } = useSession();
    const canViewDashboard = canAccess('DASHBOARD', 'view');

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboard-stats'],
        enabled: canViewDashboard,
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
    });

    if (!canViewDashboard || systemRole === 'APP_ADMIN') {
        return (
            <div className="glass-card p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-slate-900 font-display">Tổng quan hệ thống</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Tài khoản quản trị ứng dụng không được truy cập dữ liệu tài chính của từng gia đình.
                </p>
                <p className="mt-3 text-sm text-slate-500">
                    Bạn vẫn có thể dùng các API quản trị hệ thống ở backend. Giao diện quản trị ứng dụng riêng cần được tách thành một module riêng trước khi launch.
                </p>
            </div>
        );
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;
    if (isError) return <div className="p-8 text-center text-red-500 font-medium">Không thể tải dữ liệu tổng quan cho gia đình đang chọn.</div>;

    const summaryCards = [
        { label: 'Tổng tài sản', value: stats?.totalAssets || 0, icon: Package, color: 'text-[#5f87c2]', bg: 'bg-[#edf6ff]' },
        {
            label: 'Chi tiêu tháng này',
            value: formatVndAmount(stats?.monthlyExpenses || 0),
            valueClassName: getMoneyBadgeClassName(stats?.monthlyExpenses || 0, 'text-sm lg:text-base'),
            icon: Receipt,
            color: 'text-[#d56f63]',
            bg: 'bg-[#fff0ea]',
        },
        { label: 'Bảo hành sắp hết hạn', value: stats?.expiringAssets?.length || 0, icon: AlertTriangle, color: 'text-[#c58c2e]', bg: 'bg-[#fff8df]' },
        { label: 'Nhắc nhở sắp tới', value: 0, icon: Clock, color: 'text-[#6fb3a2]', bg: 'bg-[#eef9f4]' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <header>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-display">Tổng quan gia đình</h1>
                <p className="text-slate-500 mt-1 text-sm lg:text-base">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </header>

            <section className="soft-panel overflow-hidden px-4 py-4 lg:px-6 lg:py-5">
                <div className="grid items-center gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-3">
                        <span className="cute-chip">Nhìn một lần là nắm được</span>
                        <div className="space-y-1.5">
                            <h2 className="text-xl lg:text-[1.7rem] font-bold text-[#4d3b35] leading-tight">Tài sản, thu chi và việc gia đình giờ trông nhẹ nhàng hơn.</h2>
                            <p className="max-w-2xl text-sm text-[#7f675c]">
                                Mọi số liệu quan trọng được gom lại ở một nơi với màu sắc dịu mắt, giúp cả nhà dễ theo dõi mà không thấy nặng nề.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="cute-chip">Tài sản</span>
                            <span className="cute-chip">Thu chi</span>
                            <span className="cute-chip">Bảo hành</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 rounded-[28px] bg-white/35" />
                        <img
                            src="/family-soft-illustration.svg"
                            alt="Minh họa giao diện gia đình"
                            className="relative h-[180px] w-full rounded-[22px] object-cover"
                        />
                    </div>
                </div>
            </section>

            <NaturalInputBox />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {summaryCards.map((card) => (
                    <div key={card.label} className="glass-card p-3.5 lg:p-4 flex items-center gap-3 transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0", card.bg, card.color)}>
                            <card.icon size={20} className="lg:hidden" />
                            <card.icon size={20} className="hidden lg:block" />
                        </div>
                        <div>
                            <p className="text-xs lg:text-sm font-semibold text-[#8a6f61]">{card.label}</p>
                            <p className="text-lg lg:text-xl font-bold text-[#473934] tracking-tight">
                                <span className={cn(card.valueClassName)}>
                                    {card.value}
                                </span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                {/* Expenses by Category */}
                <div className="glass-card p-4 lg:p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg lg:text-xl text-[#4a3a34] font-display">Chi tiêu theo danh mục</h2>
                        <div className="cute-chip">Tháng này</div>
                    </div>
                    <div className="h-[240px] lg:h-[280px] w-full flex-1">
                        {stats?.expensesByCategory?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.expensesByCategory}
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={54}
                                        outerRadius={88}
                                        paddingAngle={5}
                                        label={window.innerWidth > 768 ? ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%` : false}
                                    >
                                        {stats.expensesByCategory.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white stroke-2" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #f4d6c7', boxShadow: '0 16px 30px rgba(226, 184, 160, 0.18)' }}
                                        formatter={(val: any) => formatVndAmount(val || 0)}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Receipt size={48} className="mb-2 opacity-20" />
                                <p>Chưa có dữ liệu chi tiêu</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expiring Assets */}
                <div className="glass-card p-4 lg:p-5">
                    <h2 className="font-bold text-lg lg:text-xl mb-4 text-[#4a3a34] font-display">Tài sản sắp hết hạn bảo hành</h2>
                    <div className="space-y-2.5 lg:space-y-3">
                        {stats?.expiringAssets?.length > 0 ? (
                            stats.expiringAssets.map((asset: any) => (
                                <div key={asset.id} className="group flex items-center justify-between p-3 rounded-[16px] bg-white/90 border border-[rgba(242,214,197,0.76)] shadow-sm transition-all hover:border-[#f1c49c] hover:bg-[#fffaf0]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-[#fff3cf] flex items-center justify-center text-[#c58c2e] group-hover:scale-110 transition-transform shrink-0">
                                            <AlertTriangle size={18} className="lg:hidden" />
                                            <AlertTriangle size={18} className="hidden lg:block" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#4a3a34] text-sm truncate">{asset.name}</p>
                                            <p className="text-[10px] lg:text-xs text-[#886f63]">
                                                Hết hạn: <span className={getDateBadgeClassName(asset.warrantyExpiredAt, 'ml-1')}>
                                                    {asset.warrantyExpiredAt ? new Date(asset.warrantyExpiredAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] lg:text-xs text-[#d56f63] font-bold px-2 py-1 rounded-xl hover:bg-white transition-colors shrink-0">
                                        Xem ngay
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-[200px] lg:h-[300px] flex flex-col items-center justify-center text-slate-400">
                                <Package size={48} className="mb-2 opacity-20" />
                                <p className="text-sm">Tất cả tài sản vẫn còn bảo hành</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
