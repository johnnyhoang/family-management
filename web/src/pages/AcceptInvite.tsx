import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { UserPlus, AlertTriangle, LogIn } from 'lucide-react';
import { authApi } from '../api/auth';
import { apiBaseUrl } from '../api/client';

const roleLabel = (role: string | null) => (role === 'FAMILY_ADMIN' ? 'Quản trị viên' : 'Thành viên');

export const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState<'loading' | 'preview' | 'accepting' | 'accepted' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [preview, setPreview] = useState<{ familyName: string | null; role: string | null; email: string } | null>(null);

    const isLoggedIn = Boolean(localStorage.getItem('token'));

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Đường dẫn lời mời không hợp lệ.');
            return;
        }

        authApi.previewInvite(token)
            .then((res) => {
                if (res.data.isExpired) {
                    setStatus('error');
                    setErrorMessage('Lời mời này đã hết hạn hoặc đã được sử dụng. Vui lòng nhờ quản trị viên gửi lời mời mới.');
                    return;
                }
                setPreview({ familyName: res.data.familyName, role: res.data.role, email: res.data.email });
                setStatus('preview');
            })
            .catch(() => {
                setStatus('error');
                setErrorMessage('Không tìm thấy lời mời này. Đường dẫn có thể đã bị sai hoặc lời mời đã bị hủy.');
            });
    }, [token]);

    const handleLoginToAccept = () => {
        localStorage.setItem('pendingInviteToken', token);
        window.location.href = `${apiBaseUrl}/auth/google`;
    };

    const handleAccept = async () => {
        setStatus('accepting');
        try {
            const res = await authApi.acceptInvite(token);
            localStorage.setItem('token', res.data.access_token);
            setStatus('accepted');
            window.location.href = '/';
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err?.response?.data?.message || 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fffaf5]">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,242,0.76),rgba(250,255,252,0.9))]" />
                <div className="absolute inset-0 bg-[url('/cute-pattern.svg')] bg-[length:240px_240px] opacity-40" />
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_60px_rgba(225,183,156,0.2)] backdrop-blur-xl text-center">
                    {status === 'loading' && (
                        <div className="py-8">
                            <Spin size="large" />
                            <p className="mt-4 text-sm text-slate-500">Đang kiểm tra lời mời...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl">
                                <AlertTriangle size={28} />
                            </div>
                            <h1 className="text-xl font-bold text-[#4d3b35]">Không thể tham gia</h1>
                            <p className="text-sm text-slate-500">{errorMessage}</p>
                            <Button type="default" block onClick={() => (window.location.href = '/')}>
                                Về trang chủ
                            </Button>
                        </div>
                    )}

                    {(status === 'preview' || status === 'accepting') && preview && (
                        <div className="space-y-5">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-[linear-gradient(135deg,#ff9f90,#f97370)] rounded-3xl shadow-lg shadow-[#f4b2a2]/40">
                                <UserPlus className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#4d3b35]">Bạn được mời tham gia</h1>
                                <p className="mt-2 text-2xl font-extrabold text-[#c85f58]">{preview.familyName || 'một gia đình'}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    với vai trò <strong>{roleLabel(preview.role)}</strong>
                                </p>
                            </div>

                            {isLoggedIn ? (
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    loading={status === 'accepting'}
                                    onClick={handleAccept}
                                    className="h-12 rounded-2xl !bg-[linear-gradient(135deg,#ff9f90,#f97370)] border-none"
                                >
                                    Chấp nhận lời mời
                                </Button>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-400">
                                        Đăng nhập bằng Google với email <strong>{preview.email}</strong> để tham gia.
                                    </p>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<LogIn size={18} />}
                                        onClick={handleLoginToAccept}
                                        className="h-12 rounded-2xl !bg-[linear-gradient(135deg,#ff9f90,#f97370)] border-none"
                                    >
                                        Đăng nhập với Google để tham gia
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
