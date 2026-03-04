import { useQuery } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    Legend
} from 'recharts';
import { Package, Receipt, AlertTriangle, Clock } from 'lucide-react';
import api from '../api/client';
import { cn } from '../utils/cn';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export const Dashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;

    const summaryCards = [
        { label: 'Tổng tài sản', value: stats?.totalAssets || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Chi tiêu tháng này', value: `${(stats?.monthlyExpenses || 0).toLocaleString()} VND`, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bảo hành sắp hết hạn', value: stats?.expiringAssets?.length || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Nhắc nhở sắp tới', value: 0, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Tổng quan gia đình</h1>
                <p className="text-slate-500 mt-1">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card) => (
                    <div key={card.label} className="glass-card p-6 flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", card.bg, card.color)}>
                            <card.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expenses by Category */}
                <div className="glass-card p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl text-slate-900 font-display">Chi tiêu theo danh mục</h2>
                        <div className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">Tháng này</div>
                    </div>
                    <div className="h-[320px] w-full flex-1">
                        {stats?.expensesByCategory?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.expensesByCategory}
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {stats.expensesByCategory.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white stroke-2" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => `${(val || 0).toLocaleString()} VND`}
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
                <div className="glass-card p-8">
                    <h2 className="font-bold text-xl mb-6 text-slate-900 font-display">Tài sản sắp hết hạn bảo hành</h2>
                    <div className="space-y-4">
                        {stats?.expiringAssets?.length > 0 ? (
                            stats.expiringAssets.map((asset: any) => (
                                <div key={asset.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-amber-200 hover:bg-amber-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{asset.name}</p>
                                            <p className="text-sm text-slate-500">
                                                Hết hạn: <span className="font-medium text-amber-600">
                                                    {asset.warrantyExpiredAt ? new Date(asset.warrantyExpiredAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-sm text-primary-600 font-bold px-3 py-1 rounded-lg hover:bg-white transition-colors">
                                        Xem ngay
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                                <Package size={48} className="mb-2 opacity-20" />
                                <p>Tất cả tài sản vẫn còn bảo hành</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
