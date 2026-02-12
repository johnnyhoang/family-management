import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Avatar } from 'antd';
import { UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import { userApi } from '../api/user';
import type { User } from '../api/user';

export const MemberList = () => {
    const queryClient = useQueryClient();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { data: members, isLoading } = useQuery({
        queryKey: ['members'],
        queryFn: () => userApi.findAll().then(res => res.data),
    });

    const inviteMutation = useMutation({
        mutationFn: ({ email, role }: { email: string; role: string }) => userApi.invite(email, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            message.success('Đã gửi lời mời tham gia gia đình');
            setIsInviteModalOpen(false);
            form.resetFields();
        },
        onError: () => {
            message.error('Không thể gửi lời mời. Vui lòng kiểm tra lại email.');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            message.success('Đã cập nhật vai trò người dùng');
        },
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => userApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            message.success('Đã xóa người dùng khỏi gia đình');
        },
    });

    const columns = [
        {
            title: 'Thành viên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar className="bg-sky-100 text-sky-600 font-bold">
                        {text?.charAt(0) || record.email.charAt(0)}
                    </Avatar>
                    <div>
                        <div className="font-medium text-slate-900">{text || 'Đang chờ...'}</div>
                        <div className="text-xs text-slate-500">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string, record: User) => (
                <Select
                    value={role}
                    size="small"
                    className="w-32"
                    onChange={(val) => updateRoleMutation.mutate({ id: record.id, role: val })}
                    options={[
                        { value: 'FAMILY_ADMIN', label: 'Quản trị viên' },
                        { value: 'MEMBER', label: 'Thành viên' },
                        { value: 'VIEWER', label: 'Người xem' },
                    ]}
                />
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: any = { ACTIVE: 'green', PENDING: 'orange', INACTIVE: 'red' };
                return <Tag color={colors[status] || 'blue'}>{status}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: User) => (
                <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                        Modal.confirm({
                            title: 'Xác nhận xóa',
                            content: `Bạn có chắc muốn xóa "${record.fullName || record.email}" khỏi gia đình?`,
                            onOk: () => removeMutation.mutate(record.id),
                        });
                    }}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Thành viên gia đình</h1>
                    <p className="text-slate-500">Quản lý những người có quyền truy cập vào tài sản gia đình</p>
                </div>
                <Button
                    type="primary"
                    icon={<UserPlus size={18} />}
                    onClick={() => setIsInviteModalOpen(true)}
                >
                    Mời thành viên
                </Button>
            </div>

            <div className="glass-card p-6">
                <Table
                    columns={columns}
                    dataSource={members}
                    loading={isLoading}
                    rowKey="id"
                    pagination={false}
                />
            </div>

            <Modal
                title="Mời thành viên mới"
                open={isInviteModalOpen}
                onCancel={() => setIsInviteModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={inviteMutation.isPending}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => inviteMutation.mutate(values)}
                    className="mt-4"
                >
                    <Form.Item
                        name="email"
                        label="Địa chỉ Email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input prefix={<Mail size={16} className="text-slate-400 mr-2" />} placeholder="member@example.com" />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true }]}
                        initialValue="MEMBER"
                    >
                        <Select options={[
                            { value: 'FAMILY_ADMIN', label: 'Quản trị viên (Toàn quyền)' },
                            { value: 'MEMBER', label: 'Thành viên (Thêm, sửa, xóa tài sản)' },
                            { value: 'VIEWER', label: 'Người xem (Chỉ xem dữ liệu)' },
                        ]} />
                    </Form.Item>
                    <div className="bg-sky-50 p-3 rounded-lg flex gap-3 text-sky-700 text-sm">
                        <Shield size={18} className="flex-shrink-0" />
                        <p>Thành viên mới sẽ nhận được email mời tham gia sau khi bạn gửi. Họ cần đăng nhập bằng Google để kích hoạt tài khoản.</p>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
