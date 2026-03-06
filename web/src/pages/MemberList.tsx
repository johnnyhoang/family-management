import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Avatar, Tooltip } from 'antd';
import { UserPlus, Shield, Trash2, Mail, Users } from 'lucide-react';
import { userApi } from '../api/user';
import type { User } from '../api/user';

export const MemberList = () => {
    const queryClient = useQueryClient();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: members, isLoading } = useQuery({
        queryKey: ['members'],
        queryFn: () => userApi.findAll().then(res => res.data),
    });

    const inviteMutation = useMutation({
        mutationFn: (values: { email: string; role: string; fullName: string }) =>
            userApi.invite(values.email, values.role, values.fullName),
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

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            message.success('Đã cập nhật thông tin thành viên');
            setIsEditModalOpen(false);
            setEditingUser(null);
            editForm.resetFields();
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

    const handleEdit = (user: User) => {
        setEditingUser(user);
        editForm.setFieldsValue(user);
        setIsEditModalOpen(true);
    };

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
            title: 'Tên khác (AI)',
            dataIndex: 'otherNames',
            key: 'otherNames',
            render: (text: string) => (
                <span className="text-slate-600 italic text-sm">{text || '-'}</span>
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
                <Space onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Xóa">
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 size={16} />}
                            onClick={(e) => {
                                e.stopPropagation();
                                Modal.confirm({
                                    title: 'Xác nhận xóa',
                                    content: `Bạn có chắc muốn xóa "${record.fullName || record.email}" khỏi gia đình?`,
                                    onOk: () => removeMutation.mutate(record.id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Thành viên gia đình</h1>
                    <p className="text-sm text-slate-500">Quản lý những người có quyền truy cập vào tài sản gia đình</p>
                </div>
                <Button
                    type="primary"
                    icon={<UserPlus size={18} />}
                    onClick={() => setIsInviteModalOpen(true)}
                    className="w-full sm:w-auto"
                >
                    Mời thành viên
                </Button>
            </div>

            <div className="glass-card p-4 lg:p-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={members}
                        loading={isLoading}
                        rowKey="id"
                        onRow={(record) => ({
                            onClick: () => handleEdit(record),
                            style: { cursor: 'pointer' }
                        })}
                        scroll={{ x: 600 }}
                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                        pagination={{
                            size: 'small',
                            showSizeChanger: false
                        }}
                    />
                </div>
            </div>

            <Modal
                title="Sửa thông tin thành viên"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                onOk={() => editForm.submit()}
                confirmLoading={updateMutation.isPending}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(values) => updateMutation.mutate({ id: editingUser!.id, data: values })}
                    className="mt-4"
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true }]}
                    >
                        <Input prefix={<Users size={16} className="text-slate-400 mr-2" />} />
                    </Form.Item>
                    <Form.Item
                        name="otherNames"
                        label="Tên gọi khác (Biệt danh)"
                        extra="Các tên cách nhau bằng dấu phẩy. VD: Con trai, Tí, Bin"
                    >
                        <Input placeholder="Tên để AI nhận diện (Khôi, Vợ, Chồng...)" />
                    </Form.Item>
                </Form>
            </Modal>

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
                        name="fullName"
                        label="Họ và tên"
                    >
                        <Input prefix={<Users size={16} className="text-slate-400 mr-2" />} placeholder="Nguyễn Văn A" />
                    </Form.Item>
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
