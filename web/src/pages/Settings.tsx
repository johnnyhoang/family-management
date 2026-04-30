import { useEffect } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message } from 'antd';
import { User, Bell, Shield, Palette, MoonStar, SunMedium, Sparkles } from 'lucide-react';
import { useThemeMode } from '../components/theme/ThemeProvider';
import { useSession } from '../components/auth/SessionProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user';

export const Settings = () => {
    const [form] = Form.useForm();
    const { themeMode, setThemeMode } = useThemeMode();
    const queryClient = useQueryClient();
    const { user, role, activeFamilyName, memberships, refreshSession, canAccess } = useSession();

    useEffect(() => {
        form.setFieldsValue({
            fullName: user?.fullName || '',
            email: user?.email || '',
            otherNames: user?.otherNames || '',
        });
    }, [form, user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (values: { fullName?: string; otherNames?: string }) => {
            if (!user?.id) {
                throw new Error('missing-user');
            }
            return userApi.update(user.id, values);
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            await refreshSession();
            message.success('Đã lưu hồ sơ cá nhân');
        },
        onError: () => {
            message.error('Không thể lưu hồ sơ cá nhân trong gia đình đang chọn');
        },
    });

    const onFinish = (values: { fullName?: string; otherNames?: string }) => {
        updateProfileMutation.mutate(values);
    };

    const canUpdateProfile = Boolean(user?.id && canAccess('USER', 'update'));

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <header>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-display">Cài đặt hệ thống</h1>
                <p className="text-slate-500 mt-1">Quản lý tài khoản và tùy chỉnh ứng dụng của bạn</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Profile Section */}
                <Card title={<div className="flex items-center gap-2"><User size={18} /><span>Hồ sơ cá nhân</span></div>} className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <Form.Item label="Họ và tên" name="fullName">
                                <Input placeholder="Nhập họ tên" disabled={!canUpdateProfile} />
                            </Form.Item>
                            <Form.Item label="Email" name="email">
                                <Input disabled />
                            </Form.Item>
                        </div>
                        <Form.Item label="Tên gọi khác cho AI" name="otherNames" extra="Phân tách bằng dấu phẩy, ví dụ: Bố, Mẹ, Bin">
                            <Input placeholder="Tên gọi khác để AI dễ nhận diện" disabled={!canUpdateProfile} />
                        </Form.Item>
                        <div className="mb-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Vai trò hiện tại</p>
                                <p className="mt-1 font-semibold text-slate-800">{role === 'FAMILY_ADMIN' ? 'Quản trị gia đình' : role === 'MEMBER' ? 'Thành viên' : 'Quản trị ứng dụng'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Gia đình đang chọn</p>
                                <p className="mt-1 font-semibold text-slate-800">{activeFamilyName || 'Không áp dụng'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số gia đình tham gia</p>
                                <p className="mt-1 font-semibold text-slate-800">{memberships.length}</p>
                            </div>
                        </div>
                        <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending} disabled={!canUpdateProfile}>Lưu thay đổi</Button>
                    </Form>
                </Card>

                {/* Notifications */}
                <Card title={<div className="flex items-center gap-2"><Bell size={18} /><span>Thông báo</span></div>} className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-800">Thông báo qua Email</p>
                                <p className="text-sm text-slate-500">Nhận thông báo về các thay đổi trong gia đình qua email</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Divider className="my-2" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-800">Cảnh báo bảo hành</p>
                                <p className="text-sm text-slate-500">Thông báo khi tài sản sắp hết hạn bảo hành</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </Card>

                {/* Privacy & Security */}
                <Card title={<div className="flex items-center gap-2"><Shield size={18} /><span>Bảo mật</span></div>} className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 mb-4">Bạn đang sử dụng đăng nhập qua Google. Mọi thông tin bảo mật được quản lý bởi tài khoản Google của bạn.</p>
                        <Button disabled>Thay đổi mật khẩu</Button>
                    </div>
                </Card>

                {/* Appearance */}
                <Card title={<div className="flex items-center gap-2"><Palette size={18} /><span>Giao diện</span></div>} className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <div className="rounded-2xl border border-[rgba(232,206,238,0.78)] bg-[linear-gradient(135deg,rgba(255,248,252,0.96),rgba(244,247,255,0.96))] p-4 shadow-[0_14px_30px_rgba(211,188,227,0.12)] dark-mode-preview-panel">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800">Chế độ tối</p>
                                <p className="mt-1 text-sm text-slate-500">Chuyển đổi giữa giao diện sáng và tối để dùng thoải mái hơn vào buổi tối hoặc môi trường ít sáng.</p>
                            </div>
                            <Switch
                                checked={themeMode === 'dark'}
                                onChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className={`rounded-2xl border p-3 shadow-sm transition-all ${themeMode === 'light' ? 'border-[#f4d4bf] ring-2 ring-[#ffd8ca]' : 'border-[rgba(243,212,191,0.78)] bg-white/85'}`}>
                                <div className="mb-2 flex items-center gap-2 text-[#b9745f]">
                                    <SunMedium size={16} />
                                    <span className="text-xs font-semibold">Sáng hiện tại</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 rounded-full bg-[#ffe6dc]" />
                                    <div className="h-3 w-4/5 rounded-full bg-[#edf7ff]" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-10 rounded-xl bg-[#fff3ec]" />
                                        <div className="h-10 rounded-xl bg-[#eef9f2]" />
                                        <div className="h-10 rounded-xl bg-[#fff7dd]" />
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-2xl border bg-[linear-gradient(180deg,#293042,#1d2230)] p-3 shadow-sm transition-all ${themeMode === 'dark' ? 'border-[#7280aa] ring-2 ring-[#5f6e98]' : 'border-[rgba(110,118,148,0.32)]'}`}>
                                <div className="mb-2 flex items-center gap-2 text-[#d8def6]">
                                    <MoonStar size={16} />
                                    <span className="text-xs font-semibold">Bản tối dự kiến</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 rounded-full bg-[#44506b]" />
                                    <div className="h-3 w-4/5 rounded-full bg-[#353f56]" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-10 rounded-xl bg-[#31394d]" />
                                        <div className="h-10 rounded-xl bg-[#273445]" />
                                        <div className="h-10 rounded-xl bg-[#3a2f4f]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <Sparkles size={14} className="text-[#9b7fd4]" />
                            <span>Giao diện đang áp dụng ngay cho các bề mặt chính, bảng, biểu mẫu và popup.</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
