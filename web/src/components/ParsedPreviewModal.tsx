import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Radio, Space, Typography, Tag, Divider, message } from 'antd';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

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

    useEffect(() => {
        if (parsedData && visible) {
            setIntent(parsedData.intent);
            form.setFieldsValue({
                ...parsedData.data,
                date: parsedData.data?.date ? dayjs(parsedData.data.date) : dayjs(),
            });
        }
    }, [parsedData, visible, form]);

    const handleFinish = (values: any) => {
        const formattedValues = {
            ...values,
            date: values.date?.format('YYYY-MM-DD'),
        };
        onConfirm({
            intent,
            data: formattedValues,
        });
    };

    const renderFormFields = () => {
        switch (intent) {
            case 'create_expense':
            case 'create_income':
                return (
                    <>
                        <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
                            <InputNumber
                                style={{ width: '100% ' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                addonAfter="VND"
                            />
                        </Form.Item>
                        <Form.Item name="category" label="Danh mục">
                            <Input placeholder="Ví dụ: Ăn uống, Di chuyển..." />
                        </Form.Item>
                        <Form.Item name="account" label="Tài khoản/Ngân hàng">
                            <Input placeholder="Ví dụ: HSBC, Tiền mặt..." />
                        </Form.Item>
                        <Form.Item name="owner" label="Người thực hiện">
                            <Input placeholder="Ví dụ: Chồng, Vợ..." />
                        </Form.Item>
                        <Form.Item name="date" label="Ngày">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="description" label="Ghi chú">
                            <Input.TextArea autoSize />
                        </Form.Item>
                    </>
                );
            case 'create_asset':
                return (
                    <>
                        <Form.Item name="name" label="Tên tài sản" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="purchase_price" label="Giá mua">
                            <InputNumber style={{ width: '100%' }} addonAfter="VND" />
                        </Form.Item>
                        <Form.Item name="purchase_date" label="Ngày mua">
                            <Input placeholder="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item name="owner" label="Người sở hữu">
                            <Input />
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
                    <Text type="secondary" size="small">
                        Độ tin cậy AI: <Tag color={parsedData?.confidence > 0.8 ? 'green' : 'orange'}>
                            {(parsedData?.confidence * 100 || 0).toFixed(0)}%
                        </Tag>
                    </Text>
                </div>
            </Form>
        </Modal>
    );
};
