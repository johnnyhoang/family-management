import { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Tag, message, Switch, Row, Col, Divider, Radio, Space } from 'antd';
import { Plus, Download, Trash2, Wallet, PlusCircle } from 'lucide-react';
import { expenseApi } from '../api/expense';
import type { Expense } from '../api/expense';
import { assetApi } from '../api/asset';
import {
  buildCategoryPathLabel,
  categoryApi,
  expenseEntryTypeLabels,
  isTransferCategory,
  type ExpenseEntryType,
  supportsExpenseEntryType,
} from '../api/category';
import { userApi } from '../api/user';
import dayjs from 'dayjs';
import { renderDateBadge, renderMoneyBadge } from '../utils/display';
import { formatVndAmount } from '../utils/currency';
import {
  confirmDuplicateWarning,
  findDuplicateExpense,
  getAssetLabel,
  getCategoryLabel,
} from '../utils/duplicates';

export const ExpenseList = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<any>({});
  const [transactionType, setTransactionType] = useState<ExpenseEntryType>('EXPENSE');
  const isTransfer = Form.useWatch('isTransfer', form) as boolean | undefined;

  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<any>(null);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.findAll(filters).then((res) => res.data),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets', 'brief'],
    queryFn: () => assetApi.findAll().then((res) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.findAll().then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.findAll().then((res) => res.data),
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

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Expense>) => expenseApi.update(editingExpense!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      message.success('Đã cập nhật giao dịch');
      setIsModalOpen(false);
      setEditingExpense(null);
      form.resetFields();
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => categoryApi.create({
      name,
      type: isTransfer ? 'LIABILITY' : transactionType,
    }),
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
    } catch {
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

  const resolveTransactionType = (expense?: Expense | null) => expense?.entryType || 'EXPENSE';

  const categorySelectOptions = useMemo(() => {
    return categories
      ?.filter((category) => (isTransfer
        ? isTransferCategory(category)
        : supportsExpenseEntryType(category, transactionType)))
      .map((category) => ({
        value: category.id,
        label: buildCategoryPathLabel(categories ?? [], category.id),
      }));
  }, [categories, isTransfer, transactionType]);

  const categoryFilterOptions = useMemo(() => {
    const direction = filters.direction as ExpenseEntryType | undefined;

    return categories
      ?.filter((category) => {
        if (!direction) {
          return category.type !== 'ASSET';
        }

        return supportsExpenseEntryType(category, direction);
      })
      .map((category) => ({
        value: category.id,
        label: buildCategoryPathLabel(categories ?? [], category.id),
      }));
  }, [categories, filters.direction]);

  const recurringCycleLabels: Record<string, string> = {
    DAILY: 'Hằng ngày',
    WEEKLY: 'Hằng tuần',
    MONTHLY: 'Hằng tháng',
    YEARLY: 'Hằng năm',
  };

  useEffect(() => {
    if (isModalOpen && !editingExpense) {
      form.setFieldValue('categoryId', undefined);
      form.setFieldValue('isTransfer', false);
    }
  }, [isModalOpen, editingExpense, form]);

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (date: string) => renderDateBadge(date),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number, record: Expense) => {
        const isIncome = record.entryType === 'INCOME' && !record.isTransfer;
        return renderMoneyBadge(val, { forceSign: isIncome ? 'plus' : 'minus' });
      },
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (name: string, record: Expense) => (
        <Space size={4} wrap>
          <Tag color={record.entryType === 'INCOME' ? 'green' : record.entryType === 'LIABILITY' ? 'red' : 'orange'}>{name}</Tag>
          {record.isTransfer ? <Tag color="blue">Chuyển nội bộ</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'entryType',
      key: 'entryType',
      render: (entryType: ExpenseEntryType) => (
        <Tag color={entryType === 'INCOME' ? 'green' : entryType === 'LIABILITY' ? 'red' : 'orange'}>
          {expenseEntryTypeLabels[entryType]}
        </Tag>
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
        is ? <Tag color="purple">{recurringCycleLabels[record.recurringCycle || ''] || record.recurringCycle}</Tag> : <Tag color="default">Không</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Expense) => (
        <Space>
          <Button
            type="text"
            icon={<Trash2 size={16} />}
            danger
            onClick={(e) => {
              e.stopPropagation();
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bản ghi này sẽ bị xóa vĩnh viễn',
                onOk: () => deleteMutation.mutate(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (expense: Expense) => {
    setTransactionType(resolveTransactionType(expense));
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      expenseDate: dayjs(expense.expenseDate),
      isTransfer: Boolean(expense.isTransfer),
    });
    setIsModalOpen(true);
  };

  const confirmDuplicateExpense = async (
    data: Partial<Expense> & { categoryId?: string },
    options?: { ignoreEditingExpense?: boolean },
  ) => {
    const duplicate = findDuplicateExpense(expenses ?? [], {
      id: options?.ignoreEditingExpense ? undefined : editingExpense?.id,
      amount: data.amount,
      categoryId: data.categoryId,
      expenseDate: data.expenseDate,
      assetId: data.assetId,
    });

    if (!duplicate) return true;

    return confirmDuplicateWarning({
      title: 'Phát hiện giao dịch trùng',
      summary: 'Đã có giao dịch cùng số tiền, danh mục, ngày thực hiện và tài sản. Bạn vẫn có thể tiếp tục nếu đây là bản ghi hợp lệ.',
      detailLines: [
        `Số tiền: ${formatVndAmount(data.amount)}`,
        `Danh mục: ${getCategoryLabel(categories ?? [], data.categoryId)}`,
        `Ngày: ${dayjs(data.expenseDate).format('DD/MM/YYYY')}`,
        `Tài sản: ${getAssetLabel(assets ?? [], data.assetId)}`,
      ],
    });
  };

  const buildExpensePayload = (values: any) => ({
    ...values,
    expenseDate: values.expenseDate?.toISOString(),
    entryType: transactionType,
    isTransfer: Boolean(values.isTransfer),
  });

  const handleCloneExpense = async () => {
    try {
      const values = await form.validateFields();
      const data = buildExpensePayload(values);
      const shouldContinue = await confirmDuplicateExpense(data, { ignoreEditingExpense: true });
      if (!shouldContinue) return;

      createMutation.mutate(data);
    } catch {
      // Ant Design form validation already handles field feedback.
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">
            Quản lý Thu chi
          </h1>
          <p className="text-sm text-slate-500">Theo dõi dòng tiền thu nhập, chi phí và công nợ trong gia đình</p>
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
              setEditingExpense(null);
              setTransactionType('EXPENSE');
              form.resetFields();
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none"
          >
            Ghi nhận
          </Button>
        </div>
      </div>

      <div className="glass-card p-4 lg:p-6 overflow-hidden">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            placeholder="Loại giao dịch"
            allowClear
            value={filters.direction}
            onChange={(val) => setFilters({
              ...filters,
              direction: val,
              categoryId: undefined,
            })}
            options={[
              { value: 'EXPENSE', label: 'Chi phí' },
              { value: 'INCOME', label: 'Thu nhập' },
              { value: 'LIABILITY', label: 'Nợ' },
            ]}
          />
          <Select
            placeholder="Danh mục"
            allowClear
            value={filters.categoryId}
            onChange={(val) => setFilters({ ...filters, categoryId: val })}
            options={categoryFilterOptions}
          />
          <Select
            placeholder="Tài sản liên quan"
            allowClear
            value={filters.assetId}
            onChange={(val) => setFilters({ ...filters, assetId: val })}
            options={assets?.map((asset) => ({ value: asset.id, label: asset.name }))}
          />
          <Select
            placeholder="Người ghi nhận"
            allowClear
            value={filters.createdBy}
            onChange={(val) => setFilters({ ...filters, createdBy: val })}
            options={users?.map((user) => ({ value: user.id, label: user.fullName || user.email }))}
          />
          <InputNumber
            className="w-full"
            placeholder="Số tiền"
            value={filters.amount}
            onChange={(value) => setFilters({ ...filters, amount: value ?? undefined })}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') || ''}
            addonAfter="đồng"
          />
        </div>

        <div className="mb-6 flex flex-1 flex-col sm:flex-row gap-3">
          <DatePicker.RangePicker
            className="flex-1"
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={(dates) => {
              setFilters({
                ...filters,
                startDate: dates ? dates[0]?.toISOString() : undefined,
                endDate: dates ? dates[1]?.toISOString() : undefined,
              });
            }}
          />
          <Button
            onClick={() => setFilters({})}
            className="w-full sm:w-auto"
          >
            Xóa bộ lọc
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={expenses}
            loading={isLoading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleEdit(record),
              className: 'cursor-pointer hover:bg-slate-50 transition-colors',
            })}
            pagination={{
              pageSize: 10,
              size: 'small',
              showSizeChanger: false,
            }}
            scroll={{ x: 800 }}
            size={window.innerWidth < 768 ? 'small' : 'middle'}
          />
        </div>
      </div>

      <Modal
        title={editingExpense ? 'Sửa giao dịch' : (transactionType === 'INCOME' ? 'Ghi nhận khoản thu' : transactionType === 'LIABILITY' ? 'Ghi nhận khoản nợ' : 'Ghi nhận chi phí')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
          setTransactionType('EXPENSE');
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={500}
        className={transactionType === 'INCOME' ? 'rounded-2xl transaction-modal-income' : 'rounded-2xl transaction-modal-expense'}
        footer={[
          <div key="metadata" className="flex flex-col items-start text-[10px] text-slate-400 mb-4 px-4 w-full">
            {editingExpense?.createdAt && (
              <span>Tạo bởi {editingExpense.creator?.fullName || editingExpense.creator?.email || 'Hệ thống'} lúc {dayjs(editingExpense.createdAt).format('HH:mm DD/MM/YYYY')}</span>
            )}
            {editingExpense?.updatedAt && editingExpense.updatedBy && (
              <span>Cập nhật cuối bởi {editingExpense.updater?.fullName || editingExpense.updater?.email || '-'} lúc {dayjs(editingExpense.updatedAt).format('HH:mm DD/MM/YYYY')}</span>
            )}
          </div>,
          editingExpense ? (
            <Button
              key="clone"
              onClick={handleCloneExpense}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Nhân bản
            </Button>
          ) : null,
          <Button key="cancel" onClick={() => { setIsModalOpen(false); setEditingExpense(null); setTransactionType('EXPENSE'); form.resetFields(); }}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={createMutation.isPending || updateMutation.isPending}>
            {editingExpense ? 'Cập nhật' : 'Ghi nhận'}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const data = buildExpensePayload(values);
            const shouldContinue = await confirmDuplicateExpense(data);
            if (!shouldContinue) return;

            if (editingExpense) {
              updateMutation.mutate(data);
            } else {
              createMutation.mutate(data);
            }
          }}
          className="mt-4"
        >
          <Form.Item label="Loại giao dịch" className="mb-4">
            <Radio.Group
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                form.setFieldValue('categoryId', undefined);
              }}
              buttonStyle="solid"
              className="w-full"
            >
              <Radio.Button value="EXPENSE" className="w-1/3 text-center">Chi phí</Radio.Button>
              <Radio.Button value="INCOME" className="w-1/3 text-center">Thu nhập</Radio.Button>
              <Radio.Button value="LIABILITY" className="w-1/3 text-center">Nợ</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber
              className="w-full h-12 text-lg font-bold"
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val!.replace(/\$\s?|(,*)/g, '')}
              prefix={<Wallet size={18} className="text-slate-400 mr-2" />}
              addonAfter="đồng"
            />
          </Form.Item>

          <div className="bg-slate-50 p-3 rounded-xl mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-700">Chuyển khoản nội bộ</div>
                <div className="text-xs text-slate-500">Không tính vào tổng thu nhập hoặc chi phí.</div>
              </div>
              <Form.Item name="isTransfer" valuePropName="checked" className="mb-0">
                <Switch size="small" onChange={() => form.setFieldValue('categoryId', undefined)} />
              </Form.Item>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                <Select
                  placeholder={isTransfer ? 'Chọn danh mục tài sản hoặc công nợ' : 'Chọn danh mục'}
                  options={categorySelectOptions}
                  notFoundContent={
                    isTransfer
                      ? 'Chưa có danh mục chuyển nội bộ phù hợp'
                      : transactionType === 'INCOME'
                        ? 'Chưa có danh mục thu — nhập tên phía dưới và bấm Thêm'
                        : transactionType === 'LIABILITY'
                          ? 'Chưa có danh mục nợ — nhập tên phía dưới và bấm Thêm'
                          : 'Chưa có danh mục — nhập tên phía dưới và bấm Thêm'
                  }
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
            <Select allowClear options={assets?.map((a) => ({ value: a.id, label: a.name }))} />
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
