import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Typography, Space, message, Tag } from 'antd';
import { SendOutlined, AudioOutlined, MutedOutlined } from '@ant-design/icons';
import api from '../api/client';
import { ParsedPreviewModal } from './ParsedPreviewModal';

const { TextArea } = Input;
const { Title } = Typography;

export const NaturalInputBox: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [parsedResult, setParsedResult] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Web Speech API
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'vi-VN';

            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            rec.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                message.error('Lỗi khi nhận diện giọng nói: ' + event.error);
            };
            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
            };

            setRecognition(rec);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognition?.stop();
        } else {
            recognition?.start();
        }
    };

    const handleParse = async () => {
        if (!inputValue.trim()) {
            message.warning('Vui lòng nhập nội dung');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(
                '/natural-input/parse',
                { message: inputValue }
            );

            if (response.data.success && response.data.intent !== 'unknown') {
                setParsedResult({
                    ...response.data,
                    originalText: inputValue // Keep the original input for the note
                });
                setShowModal(true);
                message.success('Đã phân tích xong!');
            } else if (response.data.intent === 'unknown') {
                message.info(response.data.clarification || 'AI không chắc chắn về yêu cầu của bạn. Vui lòng thử lại với cách diễn đạt khác.');
            } else {
                message.error('Không thể nhận diện ý định. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Parsing error:', error);
            message.error('Lỗi khi kết nối với máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (finalData: any) => {
        setLoading(true);
        try {
            // Mapping intent to actual API endpoints
            let endpoint = '';
            switch (finalData.intent) {
                case 'create_expense':
                case 'create_income': endpoint = '/expenses'; break;
                case 'create_asset': endpoint = '/assets'; break;
                case 'create_event': endpoint = '/calendar'; break;
                default: message.error('Hành động chưa được hỗ trợ lưu tự động.'); return;
            }

            console.log(`[NaturalInput] Saving to ${endpoint}:`, finalData.data);
            await api.post(endpoint, finalData.data);

            message.success('Đã lưu thành công!');
            setShowModal(false);
            setInputValue('');
        } catch (error) {
            console.error('Save error:', error);
            message.error('Lỗi khi lưu dữ liệu vào hệ thống');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            className="natural-input-card"
            style={{
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                marginBottom: 24,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            }}
        >
            <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SendOutlined style={{ color: '#0ea5e9' }} />
                Trợ lý Nhập liệu Thông minh <Tag color="gold">AI Powered</Tag>
            </Title>
            <div style={{ position: 'relative' }}>
                <TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Bạn muốn thực hiện việc gì? Ví dụ: 'Nhận lương 25 triệu', 'HSBC 4 triệu cho chồng'..."
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    style={{ paddingRight: 90, borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
                    <Space>
                        <Button
                            type={isListening ? 'primary' : 'default'}
                            danger={isListening}
                            shape="circle"
                            icon={isListening ? <MutedOutlined /> : <AudioOutlined />}
                            onClick={toggleListening}
                            title={isListening ? 'Dừng nói' : 'Nhập bằng giọng nói'}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            loading={loading}
                            onClick={handleParse}
                            title="Gửi"
                        />
                    </Space>
                </div>
            </div>

            <ParsedPreviewModal
                visible={showModal}
                onCancel={() => setShowModal(false)}
                onConfirm={handleConfirm}
                parsedData={parsedResult}
                loading={loading}
            />
        </Card>
    );
};
