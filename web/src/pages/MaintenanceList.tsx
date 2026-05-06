import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { Wrench, Plus, Check, Ban, Trash2 } from 'lucide-react';
import { maintenanceApi, type AssetMaintenance, type MaintenanceFrequencyType } from '../api/maintenance';
import { assetApi } from '../api/asset';
import { buildCategoryPathLabel, categoryApi, isLeafCategory } from '../api/category';
import { asArray } from '../api/client';
import { formatVndAmount } from '../utils/currency';

const statusLabels: Record<string, string> = {
  open: 'Chưa làm',
  completed: 'Đã xong',
  skipped: 'Đã bỏ qua',
};

const frequencyLabels: Record<MaintenanceFrequencyType, string> = {
  monthly: 'Theo tháng',
  yearly: 'Theo năm',
  custom_days: 'Theo số ngày',
};

export const MaintenanceList = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selected, setSelected] = useState<AssetMaintenance | null>(null);
  const [filters, setFilters] = useState<{ assetId?: string; status?: string }>({});
  const [useRepeat, setUseRepeat] = useState(false);
  const [createForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  const { data: rows = [], isPending } = useQuery({
    queryKey: ['maintenances', filters],
    queryFn: () =>
      maintenanceApi
        .findAll({
          assetId: filters.assetId,
          status: filters.status as AssetMaintenance['status'] | undefined,
        })
        .then((res) => res.data),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'maintenance-picker'],
    queryFn: () => assetApi.findAll().then((res) => asArray(res.data)),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.findAll().then((res) => res.data),
  });

  const assetOptions = useMemo(
    () =>
      assets.map((a) => ({
        value: a.id,
        label: a.name,
      })),
    [assets],
  );

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => isLeafCategory(c))
        .map((c) => ({
          value: c.id,
          label: buildCategoryPathLabel(categories, c.id),
        })),
    [categories],
  );

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenances'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof maintenanceApi.create>[0]) =>
      maintenanceApi.create(payload),
    onSuccess: (res) => {
      invalidateRelated();
      message.success(`Đã tạo ${res.data.length} lịch bảo trì`);
      setCreateOpen(false);
      createForm.resetFields();
      setUseRepeat(false);
    },
    onError: () => message.error('Không thể tạo lịch bảo trì'),
  });

  const skipMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.update(id, { status: 'skipped' }),
    onSuccess: () => {
      invalidateRelated();
      message.success('Đã đánh dấu bỏ qua');
    },
    onError: () => message.error('Không thể cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.remove(id),
    onSuccess: () => {
      invalidateRelated();
      message.success('Đã xóa lịch');
    },
    onError: () => message.error('Không thể xóa'),
  });

  const completeMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: { content: string; cost: number; categoryId: string };
    }) => maintenanceApi.complete(id, values),
    onSuccess: () => {
      invalidateRelated();
      message.success('Đã hoàn thành và ghi chi phí');
      setCompleteOpen(false);
      setSelected(null);
      completeForm.resetFields();
    },
    onError: () => message.error('Không thể hoàn thành — kiểm tra danh mục và số tiền'),
  });

  const openComplete = (record: AssetMaintenance) => {
    setSelected(record);
    completeForm.setFieldsValue({ content: '', cost: undefined, categoryId: undefined });
    setCompleteOpen(true);
  };

  const submitCreate = (values: Record<string, unknown>) => {
    const startDate = (values.startDate as { format: (f: string) => string })?.format('YYYY-MM-DD');
    if (!startDate) {
      message.warning('Chọn ngày bắt đầu');
      return;
    }
    const payload: Parameters<typeof maintenanceApi.create>[0] = {
      assetId: values.assetId as string,
      startDate,
      reminderDaysBefore: values.reminderDaysBefore as number | undefined,
    };
    if (useRepeat && values.frequencyType) {
      payload.frequencyType = values.frequencyType as MaintenanceFrequencyType;
      payload.frequencyValue = values.frequencyValue as number | undefined;
      payload.repeatCount = values.repeatCount as number | undefined;
    }
    createMutation.mutate(payload);
  };

  const columns = [
    {
      title: 'Tài sản',
      key: 'asset',
      render: (_: unknown, r: AssetMaintenance) => r.asset?.name || r.assetId,
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const color = s === 'completed' ? 'green' : s === 'skipped' ? 'default' : 'blue';
        return <Tag color={color}>{statusLabels[s] || s}</Tag>;
      },
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      render: (c: number | null) => (c != null ? formatVndAmount(c) : '—'),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (t: string | null) => t || '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, r: AssetMaintenance) => (
        <Space wrap onClick={(e) => e.stopPropagation()}>
          {r.status === 'open' ? (
            <Button type="link" size="small" icon={<Check size={16} />} onClick={() => openComplete(r)}>
              Hoàn thành
            </Button>
          ) : null}
          {r.status === 'open' ? (
            <Popconfirm title="Đánh dấu bỏ qua lịch này?" onConfirm={() => skipMutation.mutate(r.id)}>
              <Button type="link" size="small" icon={<Ban size={16} />} loading={skipMutation.isPending}>
                Bỏ qua
              </Button>
            </Popconfirm>
          ) : null}
          <Popconfirm title="Xóa lịch này?" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" danger size="small" icon={<Trash2 size={16} />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Wrench className="text-amber-600" size={28} />
            Bảo trì tài sản
          </h1>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            createForm.resetFields();
            setUseRepeat(false);
            setCreateOpen(true);
          }}
        >
          Thêm lịch
        </Button>
      </div>

      <div className="glass-card p-4 lg:p-6 overflow-hidden">
        <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <Select
            allowClear
            placeholder="Lọc theo tài sản"
            className="w-full sm:w-56"
            options={assetOptions}
            value={filters.assetId}
            onChange={(v) => setFilters({ ...filters, assetId: v || undefined })}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full sm:w-44"
            options={[
              { value: 'open', label: statusLabels.open },
              { value: 'completed', label: statusLabels.completed },
              { value: 'skipped', label: statusLabels.skipped },
            ]}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v || undefined })}
          />
        </div>

        <Table
          rowKey="id"
          loading={isPending}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          scroll={{ x: 720 }}
          size={window.innerWidth < 768 ? 'small' : 'middle'}
        />
      </div>

      <Modal
        title="Thêm lịch bảo trì"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
          setUseRepeat(false);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={submitCreate} className="mt-2">
          <Form.Item name="assetId" label="Tài sản" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={assetOptions} placeholder="Chọn tài sản" />
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Lặp theo chu kỳ">
            <Switch checked={useRepeat} onChange={setUseRepeat} />
          </Form.Item>
          {useRepeat ? (
            <>
              <Form.Item
                name="frequencyType"
                label="Kiểu chu kỳ"
                rules={[{ required: true, message: 'Chọn kiểu chu kỳ' }]}
              >
                <Select
                  placeholder="Chọn"
                  options={(Object.keys(frequencyLabels) as MaintenanceFrequencyType[]).map((k) => ({
                    value: k,
                    label: frequencyLabels[k],
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="frequencyValue"
                label="Bước (1–12: tháng/năm hoặc số ngày)"
                initialValue={1}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={12} className="w-full" />
              </Form.Item>
              <Form.Item
                name="repeatCount"
                label="Số lịch tạo (1–48)"
                initialValue={6}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={48} className="w-full" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="reminderDaysBefore" label="Nhắc trước (ngày, tùy chọn)">
            <InputNumber min={0} max={365} className="w-full" placeholder="0 = không nhắc qua lịch" />
          </Form.Item>
          <Space>
            <Button onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Tạo
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="Hoàn thành bảo trì"
        open={completeOpen}
        onCancel={() => {
          setCompleteOpen(false);
          setSelected(null);
          completeForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        {selected ? (
          <p className="text-sm text-slate-600 mb-3">
            {selected.asset?.name} · {dayjs(selected.scheduledDate).format('DD/MM/YYYY')}
          </p>
        ) : null}
        <Form
          form={completeForm}
          layout="vertical"
          onFinish={(values) => {
            if (!selected) return;
            completeMutation.mutate({
              id: selected.id,
              values: {
                content: values.content as string,
                cost: Number(values.cost),
                categoryId: values.categoryId as string,
              },
            });
          }}
        >
          <Form.Item name="content" label="Mô tả công việc" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Ví dụ: Thay dầu, vệ sinh máy..." />
          </Form.Item>
          <Form.Item name="cost" label="Chi phí (đồng)" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục chi" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={categoryOptions} placeholder="Chọn danh mục chi phí" />
          </Form.Item>
          <Space>
            <Button onClick={() => setCompleteOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={completeMutation.isPending}>
              Ghi nhận hoàn thành
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};
