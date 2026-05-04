import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, message, Select, Tag } from 'antd';
import { Plus, Trash2, FolderTree } from 'lucide-react';
import {
  buildCategoryPathLabel,
  categoryApi,
  categoryTypeLabels,
  type Category,
  type CategoryType,
} from '../api/category';

export const CategoryList = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form) as CategoryType | undefined;

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.findAll().then((res) => res.data),
  });

  const categoryTree = useMemo(() => {
    const source = categories ?? [];
    const nodeMap = new Map<string, Category & { key: string; children: Category[] }>();

    source.forEach((category) => {
      nodeMap.set(category.id, {
        ...category,
        key: category.id,
        children: [] as Category[],
      });
    });

    const roots: Array<Category & { key: string; children: Category[] }> = [];

    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Remove empty children arrays so antd doesn't render expand icon on leaves
    nodeMap.forEach((node) => {
      if ((node.children as Category[]).length === 0) {
        (node as any).children = undefined;
      }
    });

    return roots;
  }, [categories]);

  const descendantIds = useMemo(() => {
    if (!editingCategory || !categories) return new Set<string>();

    const childrenByParent = new Map<string, string[]>();
    categories.forEach((category) => {
      if (!category.parentId) return;
      const list = childrenByParent.get(category.parentId) ?? [];
      list.push(category.id);
      childrenByParent.set(category.parentId, list);
    });

    const ids = new Set<string>();
    const stack = [...(childrenByParent.get(editingCategory.id) ?? [])];

    while (stack.length) {
      const currentId = stack.pop()!;
      if (ids.has(currentId)) continue;
      ids.add(currentId);
      stack.push(...(childrenByParent.get(currentId) ?? []));
    }

    return ids;
  }, [categories, editingCategory]);

  const parentOptions = useMemo(() => {
    const excludedIds = new Set<string>(editingCategory ? [editingCategory.id, ...descendantIds] : [...descendantIds]);

    return (categories ?? [])
      .filter((category) =>
        category.type === selectedType
        && !category.parentId
        && !excludedIds.has(category.id),
      )
      .map((category) => ({
        value: category.id,
        label: buildCategoryPathLabel(categories ?? [], category.id),
      }));
  }, [categories, descendantIds, editingCategory, selectedType]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Danh mục đã được tạo');
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể tạo danh mục');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.update(editingCategory!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Đã cập nhật danh mục');
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể cập nhật danh mục');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Đã xóa danh mục');
    },
  });

  const typeColors: Record<CategoryType, string> = {
    ASSET: 'blue', INCOME: 'green', LIABILITY: 'red', EXPENSE: 'orange',
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => (
        <Space>
          <FolderTree size={16} className={!record.parentId ? 'text-slate-500' : 'text-slate-300'} />
          <span className={!record.parentId ? 'font-semibold text-slate-800' : 'text-slate-700'}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: CategoryType) => (
        <Tag color={typeColors[type]}>{categoryTypeLabels[type]}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: Category) => (
        <Space size="middle" onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            danger
            icon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: `Bạn có chắc muốn xóa danh mục "${record.name}"?`,
                onOk: () => deleteMutation.mutate(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  const isEditingGroup = editingCategory !== null && (editingCategory.children?.length ?? 0) > 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Danh mục</h1>
          <p className="text-sm text-slate-500">Quản lý danh mục 2 cấp: nhóm cha (không có cha) và danh mục lá (có nhóm cha)</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingCategory(null);
            form.resetFields();
            form.setFieldsValue({
              type: 'EXPENSE',
              parentId: undefined,
              name: '',
            });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          Thêm danh mục
        </Button>
      </div>

      <div className="glass-card p-4 lg:p-6 overflow-hidden">
        {isError && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">Không thể tải danh sách danh mục. Vui lòng thử lại.</div>}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={categoryTree}
            loading={isLoading}
            rowKey="id"
            defaultExpandAllRows
            onRow={(record) => ({
              onClick: () => {
                setEditingCategory(record);
                form.setFieldsValue({
                  name: record.name,
                  type: record.type,
                  parentId: record.parentId ?? undefined,
                });
                setIsModalOpen(true);
              },
              style: { cursor: 'pointer' },
            })}
            pagination={false}
            scroll={{ x: 500 }}
            size={window.innerWidth < 768 ? 'small' : 'middle'}
          />
        </div>
      </div>

      <Modal
        title={editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              ...values,
              parentId: values.parentId || null,
            };
            if (editingCategory) {
              updateMutation.mutate(payload);
            } else {
              createMutation.mutate(payload);
            }
          }}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Ví dụ: Đầu tư, Ăn uống, Lương..." />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại chính"
            rules={[{ required: true, message: 'Vui lòng chọn loại chính' }]}
            initialValue="EXPENSE"
          >
            <Select
              options={[
                { value: 'ASSET', label: 'Tài sản' },
                { value: 'LIABILITY', label: 'Nợ phải trả' },
                { value: 'INCOME', label: 'Thu nhập' },
                { value: 'EXPENSE', label: 'Chi phí' },
              ]}
              onChange={() => form.setFieldValue('parentId', undefined)}
            />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="Nhóm cha"
            extra={
              isEditingGroup
                ? 'Danh mục này có con, không thể thêm nhóm cha.'
                : 'Để trống để tạo nhóm cha. Chọn nhóm cha để tạo danh mục lá.'
            }
          >
            <Select
              allowClear
              disabled={isEditingGroup}
              placeholder={isEditingGroup ? 'Nhóm — không có cha' : 'Chọn nhóm cha (tùy chọn)'}
              options={parentOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
