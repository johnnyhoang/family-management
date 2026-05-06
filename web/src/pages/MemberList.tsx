import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Avatar, Spin } from 'antd';
import { UserPlus, Shield, Copy, Mail, Users, X, Check, Trash2, Send } from 'lucide-react';
import { userApi } from '../api/user';
import type { User } from '../api/user';
import { useSession } from '../components/auth/SessionProvider';
import { asPaginatedList } from '../api/client';

const MEMBER_PAGE_SIZE = 15;

export const MemberList = () => {
    const queryClient = useQueryClient();
    const { role, canAccess } = useSession();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const {
        data: memberInfinite,
        isPending: membersLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['members', 'infinite'],
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            userApi
                .findAll({ page: pageParam, pageSize: MEMBER_PAGE_SIZE })
                .then((res) => asPaginatedList(res.data)),
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    });

    const members = useMemo(
        () => memberInfinite?.pages.flatMap((p) => p.items) ?? [],
        [memberInfinite],
    );

    const onMemberTableScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const el = e.currentTarget;
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            if (nearBottom && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage],
    );

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
        if (role !== 'FAMILY_ADMIN') {
            return;
        }
        setEditingUser(user);
        editForm.setFieldsValue(user);
        setIsEditModalOpen(true);
    };

    const canManageMembers = role === 'FAMILY_ADMIN' && canAccess('USER', 'update');

    const openInviteFromMemberCopy = (record: User, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canManageMembers) return;
        form.resetFields();
        form.setFieldsValue({
            fullName: record.fullName || '',
            email: '',
            role: record.role || 'MEMBER',
        });
        setIsInviteModalOpen(true);
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
            sorter: (a: User, b: User) => (a.fullName || a.email || '').localeCompare(b.fullName || b.email || ''),
        },
        {
            title: 'Tên khác (AI)',
            dataIndex: 'otherNames',
            key: 'otherNames',
            render: (text: string) => (
                <span className="text-slate-600 italic text-sm">{text || '-'}</span>
            ),
            sorter: (a: User, b: User) => (a.otherNames || '').localeCompare(b.otherNames || ''),
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
                    disabled={!canManageMembers}
                    onChange={(val) => updateRoleMutation.mutate({ id: record.id, role: val })}
                    options={[
                        { value: 'FAMILY_ADMIN', label: 'Quản trị viên' },
                        { value: 'MEMBER', label: 'Thành viên' },
                    ]}
                />
            ),
            sorter: (a: User, b: User) => (a.role || '').localeCompare(b.role || ''),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: Record<string, string> = { ACTIVE: 'green', INVITED: 'orange', REMOVED: 'red' };
                const labels: Record<string, string> = {
                    ACTIVE: 'Hoạt động',
                    INVITED: 'Đã mời',
                    REMOVED: 'Đã rời',
                };
                return <Tag color={colors[status] || 'blue'}>{labels[status] || status}</Tag>;
            },
            sorter: (a: User, b: User) => (a.status || '').localeCompare(b.status || ''),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: unknown, record: User) => (
                <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                        type="text"
                        disabled={!canManageMembers}
                        icon={<Copy size={16} />}
                        title="Sao chép để mời (họ tên và vai trò)"
                        aria-label="Sao chép để mời"
                        onClick={(e) => openInviteFromMemberCopy(record, e)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Thành viên gia đình</h1>
                </div>
                <Button
                    type="primary"
                    icon={<UserPlus size={18} />}
                    disabled={!canManageMembers}
                    onClick={() => {
                        form.resetFields();
                        setIsInviteModalOpen(true);
                    }}
                    className="w-full sm:w-auto"
                    title="Mời thành viên"
                    aria-label="Mời thành viên"
                />
            </div>

            <div className="glass-card p-4 lg:p-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={members}
                        loading={membersLoading}
                        rowKey="id"
                        onRow={(record) => ({
                            onClick: () => handleEdit(record),
                            style: { cursor: canManageMembers ? 'pointer' : 'default' }
                        })}
                        scroll={{ x: 600, y: 'calc(100vh - 260px)' }}
                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                        pagination={false}
                        onScroll={onMemberTableScroll}
                    />
                    {isFetchingNextPage ? (
                        <div className="flex justify-center py-2">
                            <Spin size="small" />
                        </div>
                    ) : null}
                </div>
            </div>

            <Modal
                title="Sửa thông tin thành viên"
                open={isEditModalOpen}
                forceRender
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                confirmLoading={updateMutation.isPending}
                footer={[
                    editingUser ? (
                        <Button
                            key="delete"
                            danger
                            icon={<Trash2 size={18} />}
                            title="Xóa khỏi gia đình"
                            aria-label="Xóa khỏi gia đình"
                            loading={removeMutation.isPending}
                            disabled={!canManageMembers}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Xác nhận xóa',
                                    content: `Bạn có chắc muốn xóa "${editingUser.fullName || editingUser.email}" khỏi gia đình?`,
                                    onOk: () => {
                                        removeMutation.mutate(editingUser.id, {
                                            onSuccess: () => {
                                                setIsEditModalOpen(false);
                                                setEditingUser(null);
                                                editForm.resetFields();
                                            },
                                        });
                                    },
                                });
                            }}
                        />
                    ) : null,
                    <Button
                        key="cancel"
                        type="text"
                        icon={<X size={18} />}
                        title="Hủy"
                        aria-label="Hủy"
                        onClick={() => {
                            setIsEditModalOpen(false);
                            setEditingUser(null);
                            editForm.resetFields();
                        }}
                    />,
                    <Button
                        key="submit"
                        type="primary"
                        icon={<Check size={18} />}
                        title="Cập nhật"
                        aria-label="Cập nhật"
                        onClick={() => editForm.submit()}
                        loading={updateMutation.isPending}
                    />,
                ]}
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
                forceRender
                onCancel={() => {
                    setIsInviteModalOpen(false);
                    form.resetFields();
                }}
                confirmLoading={inviteMutation.isPending}
                footer={[
                    <Button
                        key="cancel"
                        type="text"
                        icon={<X size={18} />}
                        title="Hủy"
                        aria-label="Hủy"
                        onClick={() => { setIsInviteModalOpen(false); form.resetFields(); }}
                    />,
                    <Button
                        key="submit"
                        type="primary"
                        icon={<Send size={18} />}
                        title="Gửi lời mời"
                        aria-label="Gửi lời mời"
                        onClick={() => form.submit()}
                        loading={inviteMutation.isPending}
                    />,
                ]}
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
                            { value: 'MEMBER', label: 'Thành viên (Theo quyền mẫu của gia đình)' },
                        ]} />
                    </Form.Item>
                    <div className="bg-sky-50 p-3 rounded-lg flex gap-3 text-sky-700 text-sm">
                        <Shield size={18} className="flex-shrink-0" />
                        <p>Hệ thống sẽ tạo lời mời theo email và người nhận cần đăng nhập bằng Google để chấp nhận tham gia gia đình.</p>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
