import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, message } from 'antd';
import { Plus, Edit2, Trash2, FolderTree } from 'lucide-react';
import { categoryApi } from '../api/category';
import type { Category } from '../api/category';

export const CategoryList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryApi.findAll().then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Category>) => categoryApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            message.success('Danh mục đã được tạo');
            setIsModalOpen(false);
            form.resetFields();
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
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            message.success('Đã xóa danh mục');
        },
    });

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <FolderTree size={18} className="text-slate-400" />
                    <span className="font-medium text-slate-900">{text}</span>
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Category) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<Edit2 size={16} className="text-blue-600" />}
                        onClick={() => {
                            setEditingCategory(record);
                            form.setFieldsValue(record);
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
                                content: `Bạn có chắc muốn xóa danh mục "${record.name}"?`,
                                onOk: () => deleteMutation.mutate(record.id),
                            });
                        }}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Danh mục</h1>
                    <p className="text-slate-500">Quản lý các loại tài sản và chi phí</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={18} />}
                    onClick={() => {
                        setEditingCategory(null);
                        form.resetFields();
                        setIsModalOpen(true);
                    }}
                >
                    Thêm danh mục
                </Button>
            </div>

            <div className="glass-card p-6">
                <Table
                    columns={columns}
                    dataSource={categories}
                    loading={isLoading}
                    rowKey="id"
                    pagination={false}
                />
            </div>

            <Modal
                title={editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        if (editingCategory) {
                            updateMutation.mutate(values);
                        } else {
                            createMutation.mutate(values);
                        }
                    }}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Tên danh mục"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                    >
                        <Input placeholder="Ví dụ: Đồ điện tử, Tiền điện, ..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
