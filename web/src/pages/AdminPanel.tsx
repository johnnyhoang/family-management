import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Col, Divider, Row, Select, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Building2, ShieldCheck, Users } from 'lucide-react';
import { adminApi, type AdminFamily, type AdminUser } from '../api/admin';

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
          dataSource={users}
          loading={usersLoading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 760 }}
          size="small"
        />
      </Card>

      <Card className="glass-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!mb-1">Gia đình và thành viên</Typography.Title>
            <Typography.Text type="secondary">App admin có thể đổi trạng thái gia đình và vai trò family cho mọi membership.</Typography.Text>
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
          dataSource={memberRows}
          loading={familiesLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 860 }}
          size="small"
        />
      </Card>
    </div>
  );
};
