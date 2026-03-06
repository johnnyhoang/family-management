import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, Tag, message } from 'antd';
import { Plus, Download, Edit2, Trash2, Search } from 'lucide-react';
import { assetApi } from '../api/asset';
import type { Asset } from '../api/asset';
import { categoryApi } from '../api/category';
import dayjs from 'dayjs';

export const AssetList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [form] = Form.useForm();
    const [filters, setFilters] = useState<any>({});

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', filters],
        queryFn: () => assetApi.findAll(filters).then(res => res.data),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryApi.findAll().then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Asset>) => assetApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            message.success('Tài sản đã được thêm');
            setIsModalOpen(false);
            form.resetFields();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Asset>) => assetApi.update(editingAsset!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            message.success('Cập nhật thành công');
            setIsModalOpen(false);
            setEditingAsset(null);
            form.resetFields();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => assetApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            message.success('Đã xóa tài sản');
        },
    });

    const handleExport = async () => {
        try {
            const response = await assetApi.export(filters);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `assets-${dayjs().format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Lỗi khi xuất dữ liệu');
        }
    };

    const columns = [
        {
            title: 'Tên tài sản',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Asset) => (
                <div>
                    <div className="font-medium text-slate-900">{text}</div>
                    <div className="text-xs text-slate-500">{record.description}</div>
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
        },
        {
            title: 'Giá trị',
            dataIndex: 'purchasePrice',
            key: 'purchasePrice',
            render: (val: number) => <span>{val?.toLocaleString()} VND</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: any = { ACTIVE: 'green', BROKEN: 'red', SOLD: 'blue', LOST: 'gray' };
                return <Tag color={colors[status] || 'blue'}>{status}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Asset) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<Edit2 size={16} className="text-blue-600" />}
                        onClick={() => {
                            setEditingAsset(record);
                            form.setFieldsValue({
                                ...record,
                                purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
                                warrantyExpiredAt: record.warrantyExpiredAt ? dayjs(record.warrantyExpiredAt) : null,
                            });
                            setIsModalOpen(true);
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Xác nhận xóa',
                                content: `Bạn có chắc muốn xóa "${record.name}"?`,
                                onOk: () => deleteMutation.mutate(record.id),
                            });
                        }}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Quản lý tài sản</h1>
                    <p className="text-sm text-slate-500">Theo dõi và quản lý tài sản trong gia đình</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                        icon={<Download size={18} />}
                        onClick={handleExport}
                        className="flex-1 sm:flex-none"
                    >
                        Xuất CSV
                    </Button>
                    <Button
                        type="primary"
                        icon={<Plus size={18} />}
                        onClick={() => {
                            setEditingAsset(null);
                            form.resetFields();
                            setIsModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none"
                    >
                        Thêm tài sản
                    </Button>
                </div>
            </div>

            <div className="glass-card p-4 lg:p-6 overflow-hidden">
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Tìm kiếm tài sản..."
                        prefix={<Search size={16} className="text-slate-400" />}
                        className="w-full sm:max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <Select
                        placeholder="Loại trạng thái"
                        className="w-full sm:w-40"
                        allowClear
                        onChange={(val) => setFilters({ ...filters, status: val })}
                        options={[
                            { value: 'ACTIVE', label: 'Hoạt động' },
                            { value: 'BROKEN', label: 'Hỏng' },
                            { value: 'SOLD', label: 'Đã bán' },
                            { value: 'LOST', label: 'Mất' },
                        ]}
                    />
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={assets}
                        loading={isLoading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            size: 'small',
                            showSizeChanger: false
                        }}
                        scroll={{ x: 800 }}
                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                    />
                </div>
            </div>

            <Modal
                title={editingAsset ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        const data = {
                            ...values,
                            purchaseDate: values.purchaseDate?.toISOString(),
                            warrantyExpiredAt: values.warrantyExpiredAt?.toISOString(),
                        };
                        if (editingAsset) {
                            updateMutation.mutate(data);
                        } else {
                            createMutation.mutate(data);
                        }
                    }}
                    className="mt-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="name" label="Tên tài sản" rules={[{ required: true }]} className="col-span-2">
                            <Input />
                        </Form.Item>
                        <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                            <Select options={categories?.map(c => ({ value: c.id, label: c.name }))} />
                        </Form.Item>
                        <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
                            <Select options={[
                                { value: 'ACTIVE', label: 'Hoạt động' },
                                { value: 'BROKEN', label: 'Hỏng' },
                                { value: 'SOLD', label: 'Đã bán' },
                            ]} />
                        </Form.Item>
                        <Form.Item name="purchasePrice" label="Giá mua">
                            <InputNumber className="w-full" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>
                        <Form.Item name="currentValue" label="Giá hiện tại">
                            <InputNumber className="w-full" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>
                        <Form.Item name="purchaseDate" label="Ngày mua">
                            <DatePicker className="w-full" />
                        </Form.Item>
                        <Form.Item name="warrantyExpiredAt" label="Hết hạn bảo hành">
                            <DatePicker className="w-full" />
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả" className="col-span-2">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
