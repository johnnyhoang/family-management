import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Radio, Space, Typography, Tag, Divider, Select } from 'antd';
import dayjs from 'dayjs';
import { userApi } from '../api/user';
import { categoryApi } from '../api/category';
import { assetApi } from '../api/asset';
import type { User } from '../api/user';
import type { Category } from '../api/category';
import type { Asset } from '../api/asset';

const { Text } = Typography;

interface ParsedPreviewModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (data: any) => void;
    parsedData: any;
    loading?: boolean;
}

export const ParsedPreviewModal: React.FC<ParsedPreviewModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    parsedData,
    loading,
}) => {
    const [form] = Form.useForm();
    const [intent, setIntent] = useState<string>('');
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        if (visible) {
            Promise.all([
                userApi.findAll(),
                categoryApi.findAll(),
                assetApi.findAll()
            ]).then(([userRes, catRes, assetRes]) => {
                setUsers(userRes.data);
                setCategories(catRes.data);
                setAssets(assetRes.data);
            });
        }
    }, [visible]);

    useEffect(() => {
        if (parsedData && visible) {
            setIntent(parsedData.intent);

            // Map common aliases or legacy field names from AI
            const rawData = parsedData.data || {};

            // Helper to validate UUIDs to prevent backend errors from AI placeholders
            const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

            const sanitizeId = (id: any) => isUUID(id) ? id : undefined;

            const mappedData = {
                ...rawData,
                // Expense mapping
                expenseDate: rawData.expenseDate || rawData.date,
                note: parsedData.originalText || rawData.note || rawData.description,
                description: parsedData.originalText || rawData.description || rawData.note,
                categoryId: sanitizeId(rawData.categoryId || rawData.category),
                assignedToUserId: sanitizeId(rawData.assignedToUserId),
                ownerId: sanitizeId(rawData.ownerId),
                usedById: sanitizeId(rawData.usedById),
                assetId: sanitizeId(rawData.assetId),
                // Asset mapping
                purchaseDate: rawData.purchaseDate || rawData.date,
                // Event mapping
                recurrenceRule: rawData.recurrenceRule,
                participantIds: rawData.participantIds || (rawData.participants ? rawData.participants.map((p: any) => typeof p === 'string' ? sanitizeId(p) : sanitizeId(p.id)) : []),
            };

            form.setFieldsValue({
                ...mappedData,
                expenseDate: mappedData.expenseDate ? dayjs(mappedData.expenseDate) : dayjs(),
                purchaseDate: mappedData.purchaseDate ? dayjs(mappedData.purchaseDate) : dayjs(),
                date: mappedData.date ? dayjs(mappedData.date) : dayjs(), // For other intents
            });
        }
    }, [parsedData, visible, form]);

    const handleFinish = (values: any) => {
        const formattedValues = {
            ...values,
            expenseDate: values.expenseDate?.format('YYYY-MM-DD'),
            purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
            date: values.date?.format('YYYY-MM-DD'),
            participantIds: values.participantIds,
        };
        onConfirm({
            intent,
            data: formattedValues,
        });
    };

    const renderFormFields = () => {
        const userOptions = users.map(u => ({ label: u.fullName || u.email, value: u.id }));
        const assetOptions = assets.map(a => ({ label: a.name, value: a.id }));

        switch (intent) {
            case 'create_expense':
            case 'create_income':
                return (
                    <>
                        <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                addonAfter="VND"
                            />
                        </Form.Item>
                        <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                            <Select
                                options={categories
                                    .filter(c => intent === 'create_expense' ? c.type === 'EXPENSE' : c.type === 'INCOME')
                                    .map(c => ({ label: c.name, value: c.id }))
                                }
                                placeholder="Chọn danh mục..."
                                showSearch
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            />
                        </Form.Item>
                        <Form.Item name="assignedToUserId" label="Người thực hiện (Không bắt buộc)">
                            <Select options={userOptions} placeholder="Chọn thành viên..." allowClear />
                        </Form.Item>
                        <Form.Item name="assetId" label="Liên quan đến tài sản (Không bắt buộc)">
                            <Select options={assetOptions} placeholder="Chọn tài sản..." allowClear showSearch />
                        </Form.Item>
                        <Form.Item name="expenseDate" label="Ngày giao dịch" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="note" label="Ghi chú">
                            <Input.TextArea autoSize />
                        </Form.Item>
                    </>
                );
            case 'create_asset':
            case 'update_asset':
                return (
                    <>
                        <Form.Item name="name" label="Tên tài sản" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="categoryId" label="Loại tài sản">
                            <Select
                                options={categories
                                    .filter(c => c.type === 'ASSET')
                                    .map(c => ({ label: c.name, value: c.id }))
                                }
                                placeholder="Chọn loại tài sản..."
                                showSearch
                            />
                        </Form.Item>
                        {intent === 'create_asset' && (
                            <Form.Item name="purchasePrice" label="Giá mua">
                                <InputNumber style={{ width: '100%' }} addonAfter="VND" />
                            </Form.Item>
                        )}
                        <Form.Item name="purchaseDate" label="Ngày mua/cập nhật">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="ownerId" label="Người đứng tên (Không bắt buộc)">
                            <Select options={userOptions} placeholder="Chọn thành viên..." allowClear showSearch />
                        </Form.Item>
                        <Form.Item name="usedById" label="Người sử dụng (Không bắt buộc)">
                            <Select options={userOptions} placeholder="Chọn thành viên..." allowClear showSearch />
                        </Form.Item>
                        <Form.Item name="description" label="Ghi chú/Mô tả">
                            <Input.TextArea autoSize />
                        </Form.Item>
                    </>
                );
            case 'create_event':
            case 'create_task':
                return (
                    <>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="date" label="Ngày">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="time" label="Giờ">
                            <Input placeholder="HH:mm" />
                        </Form.Item>
                        <Form.Item name="recurrenceRule" label="Lặp lại">
                            <Select placeholder="Chọn chế độ lặp" allowClear>
                                <Select.Option value="DAILY">Hàng ngày</Select.Option>
                                <Select.Option value="WEEKLY">Hàng tuần</Select.Option>
                                <Select.Option value="MONTHLY">Hàng tháng</Select.Option>
                                <Select.Option value="YEARLY">Hàng năm</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="participantIds" label="Người tham gia / Nhắc cho ai">
                            <Select mode="multiple" options={userOptions} placeholder="Chọn thành viên..." allowClear showSearch />
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả">
                            <Input.TextArea autoSize />
                        </Form.Item>
                    </>
                );
            default:
                return <Text type="secondary">Ý định không xác định hoặc chưa được hỗ trợ form chỉnh sửa.</Text>;
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <Text strong>Xác nhận thông tin nhập liệu</Text>
                    <Tag color="cyan">{intent?.toUpperCase()}</Tag>
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={520}
            okText="Xác nhận & Lưu"
            cancelText="Hủy"
            styles={{ body: { paddingTop: 16 } }}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Chúng tôi đã phân tích yêu cầu của bạn. Vui lòng kiểm tra lại độ chính xác trước khi lưu vào hệ thống.</Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ currency: 'VND' }}
            >
                <Form.Item label="Loại giao dịch/hành động">
                    <Radio.Group value={intent} onChange={(e) => setIntent(e.target.value)}>
                        <Radio.Button value="create_expense">Chi tiêu</Radio.Button>
                        <Radio.Button value="create_income">Thu nhập</Radio.Button>
                        <Radio.Button value="create_asset">Tài sản</Radio.Button>
                        <Radio.Button value="create_event">Sự kiện</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                {renderFormFields()}

                <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Text type="secondary">
                        Độ tin cậy AI: <Tag color={parsedData?.confidence > 0.8 ? 'green' : 'orange'}>
                            {(parsedData?.confidence * 100 || 0).toFixed(0)}%
                        </Tag>
                    </Text>
                </div>
            </Form>
        </Modal>
    );
};
