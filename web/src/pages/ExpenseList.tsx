import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, Tag, message, Switch, Row, Col } from 'antd';
import { Plus, Download, Trash2, Wallet } from 'lucide-react';
import { expenseApi } from '../api/expense';
import type { Expense } from '../api/expense';
import { assetApi } from '../api/asset';
import dayjs from 'dayjs';

export const ExpenseList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [filters, setFilters] = useState<any>({});

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => expenseApi.findAll(filters).then(res => res.data),
    });

    const { data: assets } = useQuery({
        queryKey: ['assets', 'brief'],
        queryFn: () => assetApi.findAll().then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Expense>) => expenseApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            message.success('Chi phí đã được ghi nhận');
            setIsModalOpen(false);
            form.resetFields();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => expenseApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            message.success('Đã xóa bản ghi');
        },
    });

    const handleExport = async () => {
        try {
            const response = await expenseApi.export(filters);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses-${dayjs().format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Lỗi khi xuất dữ liệu');
        }
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'expenseDate',
            key: 'expenseDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => <span className="font-bold text-slate-900">{val?.toLocaleString()} VND</span>,
        },
        {
            title: 'Loại chi phí',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color="orange">{type}</Tag>,
        },
        {
            title: 'Tài sản liên quan',
            dataIndex: ['asset', 'name'],
            key: 'asset',
            render: (name: string) => name || '-',
        },
        {
            title: 'Định kỳ',
            dataIndex: 'isRecurring',
            key: 'isRecurring',
            render: (is: boolean, record: Expense) => (
                is ? <Tag color="purple">{record.recurringCycle}</Tag> : <Tag color="default">Không</Tag>
            ),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Expense) => (
                <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                        Modal.confirm({
                            title: 'Xác nhận xóa',
                            content: `Mục chi phí này sẽ bị xóa vĩnh viễn`,
                            onOk: () => deleteMutation.mutate(record.id),
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
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Chi phí gia đình</h1>
                    <p className="text-slate-500">Quản lý các khoản chi tiêu và hóa đơn định kỳ</p>
                </div>
                <Space>
                    <Button icon={<Download size={18} />} onClick={handleExport}>Xuất CSV</Button>
                    <Button
                        type="primary"
                        icon={<Plus size={18} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Ghi nhận chi phí
                    </Button>
                </Space>
            </div>

            <div className="glass-card p-6">
                <Row gutter={16} className="mb-4">
                    <Col span={6}>
                        <DatePicker.RangePicker
                            className="w-full"
                            onChange={(dates) => {
                                setFilters({
                                    ...filters,
                                    startDate: dates ? dates[0]?.toISOString() : undefined,
                                    endDate: dates ? dates[1]?.toISOString() : undefined
                                });
                            }}
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder="Tài sản"
                            className="w-full"
                            allowClear
                            onChange={(val) => setFilters({ ...filters, assetId: val })}
                            options={assets?.map(a => ({ value: a.id, label: a.name }))}
                        />
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={expenses}
                    loading={isLoading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title="Ghi nhận chi phí mới"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        const data = {
                            ...values,
                            expenseDate: values.expenseDate?.toISOString(),
                        };
                        createMutation.mutate(data);
                    }}
                    className="mt-4"
                >
                    <Form.Item name="amount" label="Số tiền (VND)" rules={[{ required: true }]}>
                        <InputNumber className="w-full" prefix={<Wallet size={16} className="text-slate-400 mr-2" />} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Loại chi phí" rules={[{ required: true }]}>
                                <Select options={[
                                    { value: 'ELECTRICITY', label: 'Điện' },
                                    { value: 'WATER', label: 'Nước' },
                                    { value: 'INTERNET', label: 'Internet' },
                                    { value: 'MAINTENANCE', label: 'Bảo trì' },
                                    { value: 'REPAIR', label: 'Sửa chữa' },
                                    { value: 'OTHER', label: 'Khác' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="expenseDate" label="Ngày chi" initialValue={dayjs()}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="assetId" label="Tài sản liên quan (Tùy chọn)">
                        <Select allowClear options={assets?.map(a => ({ value: a.id, label: a.name }))} />
                    </Form.Item>

                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-slate-600">Định kỳ</span>
                        <Form.Item name="isRecurring" valuePropName="checked" noStyle>
                            <Switch />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => prev.isRecurring !== curr.isRecurring}
                        >
                            {({ getFieldValue }) => getFieldValue('isRecurring') ? (
                                <Form.Item name="recurringCycle" noStyle>
                                    <Select className="flex-1" options={[
                                        { value: 'DAILY', label: 'Hàng ngày' },
                                        { value: 'WEEKLY', label: 'Hàng tuần' },
                                        { value: 'MONTHLY', label: 'Hàng tháng' },
                                        { value: 'YEARLY', label: 'Hàng năm' },
                                    ]} />
                                </Form.Item>
                            ) : null}
                        </Form.Item>
                    </div>

                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
