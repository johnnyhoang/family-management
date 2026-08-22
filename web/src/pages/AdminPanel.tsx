import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Col, Divider, Row, Select, Table, Tag, Typography, Button, Modal, Form, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Building2, ShieldCheck, Users, Plus, UserPlus } from 'lucide-react';
import { adminApi, type AdminFamily, type AdminUser } from '../api/admin';

const ADMIN_USER_CHUNK = 8;
const ADMIN_MEMBER_CHUNK = 10;

type FamilyMemberRow = {
  key: string;
  familyId: string;
  familyName: string;
  familyStatus: 'ACTIVE' | 'INACTIVE';
  userId: string;
  fullName: string | null;
  email: string;
  systemRole: 'USER' | 'APP_ADMIN';
  role: 'FAMILY_ADMIN' | 'MEMBER';
};

export const AdminPanel = () => {
  const queryClient = useQueryClient();
  const [userVisibleCount, setUserVisibleCount] = useState(ADMIN_USER_CHUNK);
  const [memberVisibleCount, setMemberVisibleCount] = useState(ADMIN_MEMBER_CHUNK);
  const [isCreateFamilyModalOpen, setIsCreateFamilyModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [createFamilyForm] = Form.useForm();
  const [addMemberForm] = Form.useForm();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((res) => res.data),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers().then((res) => res.data),
  });

  const { data: families, isLoading: familiesLoading } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => adminApi.getFamilies().then((res) => res.data),
  });

  const createFamilyMutation = useMutation({
    mutationFn: (data: { name: string; adminUserId?: string }) => adminApi.createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-families'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      message.success('Đã tạo gia đình mới thành công');
      setIsCreateFamilyModalOpen(false);
      createFamilyForm.resetFields();
    },
    onError: () => message.error('Không thể tạo gia đình mới'),
  });

  const addFamilyMemberMutation = useMutation({
    mutationFn: ({ familyId, userId, role }: { familyId: string; userId: string; role: 'FAMILY_ADMIN' | 'MEMBER' }) =>
      adminApi.addFamilyMember(familyId, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-families'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      message.success('Đã gán người dùng vào gia đình thành công');
      setIsAddMemberModalOpen(false);
      addMemberForm.resetFields();
    },
    onError: () => message.error('Không thể gán người dùng vào gia đình'),
  });

  const updateSystemRoleMutation = useMutation({
    mutationFn: ({ userId, systemRole }: { userId: string; systemRole: 'USER' | 'APP_ADMIN' }) =>
      adminApi.updateSystemRole(userId, systemRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-families'] });
      message.success('Đã cập nhật quyền quản trị ứng dụng');
    },
    onError: () => message.error('Không thể cập nhật quyền quản trị ứng dụng'),
  });

  const updateFamilyStatusMutation = useMutation({
    mutationFn: ({ familyId, status }: { familyId: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.updateFamilyStatus(familyId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-families'] });
      message.success('Đã cập nhật trạng thái gia đình');
    },
    onError: () => message.error('Không thể cập nhật trạng thái gia đình'),
  });

  const updateFamilyRoleMutation = useMutation({
    mutationFn: ({ familyId, userId, role }: { familyId: string; userId: string; role: 'FAMILY_ADMIN' | 'MEMBER' }) =>
      adminApi.updateFamilyMemberRole(familyId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-families'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      message.success('Đã cập nhật vai trò trong gia đình');
    },
    onError: () => message.error('Không thể cập nhật vai trò trong gia đình'),
  });

  const memberRows = useMemo<FamilyMemberRow[]>(() => (
    (families ?? []).flatMap((family) =>
      family.members.map((member) => ({
        key: `${family.id}:${member.id}`,
        familyId: family.id,
        familyName: family.name,
        familyStatus: family.status,
        userId: member.id,
        fullName: member.fullName,
        email: member.email,
        systemRole: member.systemRole,
        role: member.role,
      })),
    )
  ), [families]);

  useEffect(() => {
    setUserVisibleCount(ADMIN_USER_CHUNK);
  }, [users]);

  useEffect(() => {
    setMemberVisibleCount(ADMIN_MEMBER_CHUNK);
  }, [memberRows]);

  const usersTableSlice = useMemo(
    () => (users ?? []).slice(0, userVisibleCount),
    [users, userVisibleCount],
  );

  const memberRowsSlice = useMemo(
    () => memberRows.slice(0, memberVisibleCount),
    [memberRows, memberVisibleCount],
  );

  const onAdminUserTableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      const total = users?.length ?? 0;
      if (nearBottom && userVisibleCount < total) {
        setUserVisibleCount((c) => Math.min(c + ADMIN_USER_CHUNK, total));
      }
    },
    [users?.length, userVisibleCount],
  );

  const onAdminMemberTableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      const total = memberRows.length;
      if (nearBottom && memberVisibleCount < total) {
        setMemberVisibleCount((c) => Math.min(c + ADMIN_MEMBER_CHUNK, total));
      }
    },
    [memberRows.length, memberVisibleCount],
  );

  const userColumns: ColumnsType<AdminUser> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">{record.fullName || 'Chưa đặt tên'}</div>
          <div className="text-xs text-slate-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Quyền hệ thống',
      dataIndex: 'systemRole',
      key: 'systemRole',
      render: (value: 'USER' | 'APP_ADMIN', record) => (
        <Select
          size="small"
          value={value}
          className="w-40"
          loading={updateSystemRoleMutation.isPending}
          onChange={(nextValue) => updateSystemRoleMutation.mutate({ userId: record.id, systemRole: nextValue })}
          options={[
            { value: 'USER', label: 'Người dùng thường' },
            { value: 'APP_ADMIN', label: 'Quản trị ứng dụng' },
          ]}
        />
      ),
    },
    {
      title: 'Gia đình tham gia',
      key: 'memberships',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1.5">
          {record.memberships.length > 0
            ? record.memberships.map((membership) => (
              <Tag key={`${record.id}-${membership.familyId}`}>
                {membership.familyName} · {membership.role === 'FAMILY_ADMIN' ? 'Quản trị' : 'Thành viên'}
              </Tag>
            ))
            : <span className="text-xs text-slate-400">Chưa tham gia gia đình nào</span>}
        </div>
      ),
    },
  ];

  const memberColumns: ColumnsType<FamilyMemberRow> = [
    {
      title: 'Gia đình',
      key: 'family',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">{record.familyName}</div>
          <div className="text-xs text-slate-500">{record.familyStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}</div>
        </div>
      ),
    },
    {
      title: 'Thành viên',
      key: 'member',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">{record.fullName || 'Chưa đặt tên'}</div>
          <div className="text-xs text-slate-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Quyền hệ thống',
      dataIndex: 'systemRole',
      key: 'systemRole',
      render: (value: 'USER' | 'APP_ADMIN') => (
        <Tag color={value === 'APP_ADMIN' ? 'purple' : 'default'}>
          {value === 'APP_ADMIN' ? 'APP_ADMIN' : 'USER'}
        </Tag>
      ),
    },
    {
      title: 'Vai trò trong gia đình',
      dataIndex: 'role',
      key: 'role',
      render: (value: 'FAMILY_ADMIN' | 'MEMBER', record) => (
        <Select
          size="small"
          value={value}
          className="w-36"
          loading={updateFamilyRoleMutation.isPending}
          onChange={(nextValue) => updateFamilyRoleMutation.mutate({
            familyId: record.familyId,
            userId: record.userId,
            role: nextValue,
          })}
          options={[
            { value: 'FAMILY_ADMIN', label: 'Quản trị gia đình' },
            { value: 'MEMBER', label: 'Thành viên' },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 font-display">Quản trị ứng dụng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem cấu trúc gia đình, chỉnh vai trò thành viên và cấp quyền APP_ADMIN ở mức hệ thống.
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="glass-card" loading={statsLoading}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#efe7ff] text-[#7b61c8]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Người dùng</div>
                <div className="text-2xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="glass-card" loading={statsLoading}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5ff] text-[#4f86c7]">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Gia đình</div>
                <div className="text-2xl font-bold text-slate-900">{stats?.totalFamilies ?? 0}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="glass-card" loading={statsLoading}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9faf0] text-[#55a67c]">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Membership đang hoạt động</div>
                <div className="text-2xl font-bold text-slate-900">{stats?.totalMemberships ?? 0}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="glass-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!mb-1">Quyền hệ thống</Typography.Title>
            <Typography.Text type="secondary">Chỉ APP_ADMIN mới có thể nâng hoặc hạ quyền quản trị ứng dụng.</Typography.Text>
          </div>
        </div>
        <Table
          rowKey="id"
          columns={userColumns}
          dataSource={usersTableSlice}
          loading={usersLoading}
          pagination={false}
          onScroll={onAdminUserTableScroll}
          scroll={{ x: 760, y: 360 }}
          size="small"
        />
      </Card>

      <Card className="glass-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!mb-1">Gia đình và thành viên</Typography.Title>
            <Typography.Text type="secondary">App admin có thể tạo gia đình mới, chỉ định chủ hộ, và gán thành viên vào bất kỳ gia đình nào.</Typography.Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<Plus size={14} />}
              className="bg-[#c85f58] hover:bg-[#b04a43]"
              onClick={() => setIsCreateFamilyModalOpen(true)}
            >
              Tạo gia đình mới
            </Button>
            <Button
              icon={<UserPlus size={14} />}
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              Gán thành viên
            </Button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(families ?? []).map((family: AdminFamily) => (
            <div key={family.id} className="rounded-2xl border border-[rgba(242,214,197,0.78)] bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{family.name}</p>
                  <p className="text-xs text-slate-500">{family.members.length} thành viên</p>
                </div>
                <Select
                  size="small"
                  value={family.status}
                  className="w-36"
                  loading={updateFamilyStatusMutation.isPending}
                  onChange={(status) => updateFamilyStatusMutation.mutate({ familyId: family.id, status })}
                  options={[
                    { value: 'ACTIVE', label: 'Đang hoạt động' },
                    { value: 'INACTIVE', label: 'Ngưng hoạt động' },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>

        <Divider />

        <Table
          rowKey="key"
          columns={memberColumns}
          dataSource={memberRowsSlice}
          loading={familiesLoading}
          pagination={false}
          onScroll={onAdminMemberTableScroll}
          scroll={{ x: 860, y: 400 }}
          size="small"
        />
      </Card>

      {/* Modal Tạo Gia Đình Mới */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Building2 size={18} className="text-[#c85f58]" />
            <span>Tạo Gia Đình Mới (Quyền Quản Trị Hệ Thống)</span>
          </div>
        }
        open={isCreateFamilyModalOpen}
        onCancel={() => setIsCreateFamilyModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <p className="text-xs text-slate-500 mb-4">
          Tạo một gia đình mới trong hệ thống và tùy chọn chỉ định một người dùng làm Chủ hộ / Quản trị gia đình (FAMILY_ADMIN).
        </p>
        <Form
          form={createFamilyForm}
          layout="vertical"
          onFinish={(values) => createFamilyMutation.mutate(values)}
        >
          <Form.Item
            name="name"
            label="Tên gia đình"
            rules={[{ required: true, message: 'Vui lòng nhập tên gia đình' }]}
          >
            <Input placeholder="Ví dụ: Gia đình Nguyễn Văn C" size="large" />
          </Form.Item>
          <Form.Item
            name="adminUserId"
            label="Chỉ định Chủ hộ / Quản trị viên (Tùy chọn)"
            tooltip="Người dùng được chọn sẽ có quyền Quản trị viên (FAMILY_ADMIN) của gia đình này"
          >
            <Select
              placeholder="Chọn người dùng làm Quản trị gia đình"
              size="large"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(users ?? []).map((u) => ({
                value: u.id,
                label: `${u.fullName || 'Chưa đặt tên'} (${u.email})`,
              }))}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsCreateFamilyModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createFamilyMutation.isPending}
              className="bg-[#c85f58] hover:bg-[#b04a43]"
            >
              Tạo gia đình
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Gán Thành Viên Vào Gia Đình */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <UserPlus size={18} className="text-[#c85f58]" />
            <span>Gán Người Dùng Vào Gia Đình</span>
          </div>
        }
        open={isAddMemberModalOpen}
        onCancel={() => setIsAddMemberModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <p className="text-xs text-slate-500 mb-4">
          Chỉ định trực tiếp bất kỳ tài khoản người dùng nào vào một gia đình với vai trò cụ thể.
        </p>
        <Form
          form={addMemberForm}
          layout="vertical"
          initialValues={{ role: 'MEMBER' }}
          onFinish={(values) => addFamilyMemberMutation.mutate(values)}
        >
          <Form.Item
            name="familyId"
            label="Chọn Gia đình"
            rules={[{ required: true, message: 'Vui lòng chọn gia đình' }]}
          >
            <Select
              placeholder="Chọn gia đình"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(families ?? []).map((f) => ({
                value: f.id,
                label: f.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="userId"
            label="Chọn Người dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
          >
            <Select
              placeholder="Chọn người dùng"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(users ?? []).map((u) => ({
                value: u.id,
                label: `${u.fullName || 'Chưa đặt tên'} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò trong gia đình"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              size="large"
              options={[
                { value: 'FAMILY_ADMIN', label: 'Quản trị gia đình (Chủ hộ)' },
                { value: 'MEMBER', label: 'Thành viên' },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAddMemberModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addFamilyMemberMutation.isPending}
              className="bg-[#c85f58] hover:bg-[#b04a43]"
            >
              Gán thành viên
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
