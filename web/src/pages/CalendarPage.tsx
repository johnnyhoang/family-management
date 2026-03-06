import { useState } from 'react';
import {
    Calendar,
    Badge,
    Card,
    Button,
    Modal,
    Form,
    Input,
    DatePicker,
    Select,
    message,
    Typography,
    Space,
    Tag
} from 'antd';
import { Plus, MapPin, Clock } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar';
import type { CalendarEvent } from '../api/calendar';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

export const CalendarPage = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: events = [] } = useQuery({
        queryKey: ['calendar-events'],
        queryFn: () => calendarApi.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: (values: any) => calendarApi.create(values),
        onSuccess: () => {
            message.success('Thêm sự kiện thành công');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        },
    });

    const getListData = (value: Dayjs) => {
        return events.filter((event: CalendarEvent) => dayjs(event.startDate).isSame(value, 'day'));
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul className="list-none p-0 m-0 overflow-hidden">
                {listData.map((item: CalendarEvent) => (
                    <li key={item.id} className="mt-1">
                        <Badge
                            status={item.type === 'MAINTENANCE' ? 'warning' : 'processing'}
                            text={<span className="text-[10px] truncate max-w-[80px] inline-block">{item.title}</span>}
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const onSelect = (newValue: Dayjs) => {
        setSelectedDate(newValue);
        // Show events for this day or open modal
    };

    const handleCreate = (values: any) => {
        createMutation.mutate({
            ...values,
            startDate: values.startDate.toISOString(),
            endDate: values.endDate?.toISOString(),
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
            >
                <div>
                    <Title level={2} className="!m-0">Lịch gia đình</Title>
                    <Text type="secondary">Quản lý sự kiện, nhắc nhở và lịch trình bảo trì</Text>
                </div>
                <Button
                    type="primary"
                    icon={<Plus className="w-4 h-4" />}
                    size="large"
                    onClick={() => {
                        setSelectedEvent(null);
                        setIsModalVisible(true);
                        form.setFieldsValue({ startDate: selectedDate });
                    }}
                    className="bg-sky-500 hover:bg-sky-600 border-none shadow-lg shadow-sky-200/50 h-12 px-6 rounded-xl flex items-center justify-center gap-2"
                >
                    Thêm sự kiện
                </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden glass-card">
                    <Calendar
                        fullscreen={true}
                        cellRender={dateCellRender}
                        onSelect={onSelect}
                        className="p-4"
                    />
                </Card>

                <div className="flex flex-col gap-6">
                    <Card
                        title={<Title level={4} className="!m-0">Sự kiện ngày {selectedDate.format('DD/MM')}</Title>}
                        className="border-none shadow-xl shadow-slate-200/50 rounded-2xl glass-card flex-1"
                    >
                        <AnimatePresence mode="wait">
                            {getListData(selectedDate).length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {getListData(selectedDate).map((event: CalendarEvent) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 rounded-xl border border-slate-100 bg-white/80 hover:bg-white transition-all shadow-sm group relative"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <Title level={5} className="!m-0 !text-slate-800">{event.title}</Title>
                                                <Tag color={event.type === 'MAINTENANCE' ? 'orange' : 'blue'}>
                                                    {event.type}
                                                </Tag>
                                            </div>
                                            <Text type="secondary" className="block mb-3 line-clamp-2">
                                                {event.description || 'Không có mô tả'}
                                            </Text>
                                            <Space className="w-full text-slate-500 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{dayjs(event.startDate).format('HH:mm')}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1.5 ">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[120px]">{event.location}</span>
                                                    </div>
                                                )}
                                            </Space>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Text type="secondary">Trống - Hãy thêm sự kiện mới</Text>
                                </div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>
            </div>

            <Modal
                title={selectedEvent ? "Sửa sự kiện" : "Thêm sự kiện mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
                className="premium-modal"
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    className="mt-6"
                    initialValues={{ type: 'EVENT', isFullDay: false }}
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Ví dụ: Bảo trì xe máy, Tiệc sinh nhật..." className="rounded-lg h-10" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="type"
                            label="Loại"
                            rules={[{ required: true }]}
                        >
                            <Select className="h-10">
                                <Select.Option value="EVENT">Sự kiện</Select.Option>
                                <Select.Option value="MAINTENANCE">Bảo trì</Select.Option>
                                <Select.Option value="PAYMENT">Thanh toán</Select.Option>
                                <Select.Option value="REMINDER">Ghi chú</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="reminderMinutes"
                            label="Báo trước (phút)"
                        >
                            <Select className="h-10">
                                <Select.Option value={0}>Không báo</Select.Option>
                                <Select.Option value={15}>15 phút</Select.Option>
                                <Select.Option value={30}>30 phút</Select.Option>
                                <Select.Option value={60}>1 tiếng</Select.Option>
                                <Select.Option value={1440}>1 ngày</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="startDate"
                            label="Bắt đầu"
                            rules={[{ required: true }]}
                        >
                            <DatePicker showTime className="w-full h-10 rounded-lg" />
                        </Form.Item>
                        <Form.Item
                            name="endDate"
                            label="Kết thúc"
                        >
                            <DatePicker showTime className="w-full h-10 rounded-lg" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="location"
                        label="Địa điểm"
                    >
                        <Input prefix={<MapPin className="w-4 h-4 text-slate-400" />} placeholder="Nhập địa điểm..." className="rounded-lg h-10" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea placeholder="Ghi chú thêm..." rows={3} className="rounded-lg" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={() => setIsModalVisible(false)} className="rounded-lg h-10 px-6">
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createMutation.isPending}
                            className="bg-sky-500 hover:bg-sky-600 border-none rounded-lg h-10 px-8"
                        >
                            {selectedEvent ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
