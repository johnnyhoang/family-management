import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Tag, message, Switch, Row, Col, Divider, Radio } from 'antd';
import { Plus, Download, Trash2, Wallet, PlusCircle } from 'lucide-react';
import { expenseApi } from '../api/expense';
import type { Expense } from '../api/expense';
import { assetApi } from '../api/asset';
import { categoryApi } from '../api/category';
import dayjs from 'dayjs';

export const ExpenseList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [filters, setFilters] = useState<any>({ direction: 'EXPENSE' });

    // Quick add category state
    const [newCategoryName, setNewCategoryName] = useState('');
    const inputRef = useRef<any>(null);

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => expenseApi.findAll(filters).then(res => res.data),
    });

    const { data: assets } = useQuery({
        queryKey: ['assets', 'brief'],
        queryFn: () => assetApi.findAll().then(res => res.data),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryApi.findAll().then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Expense>) => expenseApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            message.success('Giao dịch đã được ghi nhận');
            setIsModalOpen(false);
            form.resetFields();
        },
    });

    const addCategoryMutation = useMutation({
        mutationFn: (name: string) => categoryApi.create({ name, type: filters.direction || 'EXPENSE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            message.success('Đã thêm danh mục mới');
            setNewCategoryName('');
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
            link.setAttribute('download', `transactions-${dayjs().format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error('Lỗi khi xuất dữ liệu');
        }
    };

    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewCategoryName(event.target.value);
    };

    const addItem = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault();
        if (newCategoryName) {
            addCategoryMutation.mutate(newCategoryName);
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
            render: (val: number, record: Expense) => {
                const isIncome = record.category?.type === 'INCOME';
                return (
                    <span className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{Number(val)?.toLocaleString()} VND
                    </span>
                );
            },
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            render: (name: string, record: Expense) => (
                <Tag color={record.category?.type === 'INCOME' ? 'green' : 'orange'}>{name}</Tag>
            ),
        },
        {
            title: 'Tài sản',
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
                            content: `Bản ghi này sẽ bị xóa vĩnh viễn`,
                            onOk: () => deleteMutation.mutate(record.id),
                        });
                    }}
                />
            ),
        },
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">
                        Quản lý Thu chi
                    </h1>
                    <p className="text-sm text-slate-500">Theo dõi dòng tiền thu vào và chi ra trong gia đình</p>
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
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none"
                    >
                        Ghi nhận
                    </Button>
                </div>
            </div>

            <div className="glass-card p-4 lg:p-6 overflow-hidden">
                <div className="mb-6 flex flex-col lg:flex-row gap-4">
                    <Radio.Group
                        value={filters.direction || 'EXPENSE'}
                        onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                        buttonStyle="solid"
                        className="flex-shrink-0"
                    >
                        <Radio.Button value="EXPENSE" className="px-6">Chi ra (-)</Radio.Button>
                        <Radio.Button value="INCOME" className="px-6">Thu vào (+)</Radio.Button>
                        <Radio.Button value={undefined} className="px-6">Tất cả</Radio.Button>
                    </Radio.Group>

                    <div className="flex flex-1 flex-col sm:flex-row gap-3">
                        <DatePicker.RangePicker
                            className="flex-1"
                            placeholder={['Từ ngày', 'Đến ngày']}
                            onChange={(dates) => {
                                setFilters({
                                    ...filters,
                                    startDate: dates ? dates[0]?.toISOString() : undefined,
                                    endDate: dates ? dates[1]?.toISOString() : undefined
                                });
                            }}
                        />
                        <Select
                            placeholder="Tài sản"
                            className="w-full sm:w-48"
                            allowClear
                            onChange={(val) => setFilters({ ...filters, assetId: val })}
                            options={assets?.map(a => ({ value: a.id, label: a.name }))}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={expenses}
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
                title={filters.direction === 'INCOME' ? "Ghi nhận khoản thu" : "Ghi nhận chi phí"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                width={500}
                className="rounded-2xl"
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
                        <InputNumber
                            className="w-full h-12 text-lg font-bold"
                            formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={val => val!.replace(/\$\s?|(,*)/g, '')}
                            prefix={<Wallet size={18} className="text-slate-400 mr-2" />}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Chọn danh mục"
                                    options={categories?.filter(c => !filters.direction || c.type === filters.direction).map(c => ({ value: c.id, label: c.name }))}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: '8px 0' }} />
                                            <Space style={{ padding: '0 8px 4px' }}>
                                                <Input
                                                    placeholder="Thêm mới..."
                                                    ref={inputRef}
                                                    value={newCategoryName}
                                                    onChange={onNameChange}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                                <Button type="text" icon={<PlusCircle size={16} />} onClick={addItem} loading={addCategoryMutation.isPending}>
                                                    Thêm
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="expenseDate" label="Ngày thực hiện" initialValue={dayjs()}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="assetId" label="Tài sản liên quan (Tùy chọn)">
                        <Select allowClear options={assets?.map(a => ({ value: a.id, label: a.name }))} />
                    </Form.Item>

                    <div className="bg-slate-50 p-4 rounded-xl mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Switch size="small" onChange={(checked) => form.setFieldValue('isRecurring', checked)} />
                                <span className="text-sm font-medium text-slate-600">Định kỳ / Lặp lại</span>
                            </div>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.isRecurring !== curr.isRecurring}
                            >
                                {({ getFieldValue }) => getFieldValue('isRecurring') ? (
                                    <Form.Item name="recurringCycle" noStyle initialValue="MONTHLY">
                                        <Select className="w-32" size="small" options={[
                                            { value: 'DAILY', label: 'Hằng ngày' },
                                            { value: 'WEEKLY', label: 'Hằng tuần' },
                                            { value: 'MONTHLY', label: 'Hằng tháng' },
                                            { value: 'YEARLY', label: 'Hằng năm' },
                                        ]} />
                                    </Form.Item>
                                ) : null}
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
