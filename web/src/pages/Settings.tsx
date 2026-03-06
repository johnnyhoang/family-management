import { Card, Form, Input, Button, Switch, Divider, message } from 'antd';
import { User, Bell, Shield, Palette } from 'lucide-react';

export const Settings = () => {
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Success:', values);
        message.success('Cài đặt đã được lưu');
    };

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
                            <Form.Item label="Họ và tên" name="fullName" initialValue="Admin User">
                                <Input placeholder="Nhập họ tên" />
                            </Form.Item>
                            <Form.Item label="Email" name="email" initialValue="admin@example.com">
                                <Input disabled />
                            </Form.Item>
                        </div>
                        <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
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
                        <Button>Thay đổi mật khẩu</Button>
                    </div>
                </Card>

                {/* Appearance */}
                <Card title={<div className="flex items-center gap-2"><Palette size={18} /><span>Giao diện</span></div>} className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-slate-800">Chế độ tối (Dark Mode)</p>
                            <p className="text-sm text-slate-500">Chuyển đổi giữa giao diện sáng và tối (Sắp ra mắt)</p>
                        </div>
                        <Switch disabled />
                    </div>
                </Card>
            </div>
        </div>
    );
};
