import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { getSupabaseClient } from '../lib/supabase';
import api from '../api/client';

export const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function processLogin() {
            // Trường hợp 1: Token truyền qua URL query param (legacy)
            const queryToken = searchParams.get('token');
            if (queryToken) {
                localStorage.setItem('token', queryToken);
                handleRedirect();
                return;
            }

            // Trường hợp 2: Lấy session từ Supabase OAuth
            try {
                const supabase = await getSupabaseClient();
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    // Kiểm tra token trong hash URL
                    const hash = window.location.hash;
                    if (hash.includes('access_token')) {
                        const params = new URLSearchParams(hash.replace(/^#/, ''));
                        const accessToken = params.get('access_token');
                        if (accessToken) {
                            return exchangeSupabaseToken(accessToken);
                        }
                    }
                    if (isMounted) {
                        setErrorMessage('Không tìm thấy phiên đăng nhập hợp lệ.');
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                    }
                    return;
                }

                await exchangeSupabaseToken(session.access_token);
            } catch (err: any) {
                if (isMounted) {
                    setErrorMessage(err.response?.data?.message || err.message || 'Lỗi khi đồng bộ tài khoản');
                    setTimeout(() => navigate('/login', { replace: true }), 2500);
                }
            }
        }

        async function exchangeSupabaseToken(supabaseToken: string) {
            try {
                const res = await api.post('/auth/supabase', { token: supabaseToken });
                const appToken = res.data?.access_token;
                if (appToken) {
                    localStorage.setItem('token', appToken);
                    handleRedirect();
                } else {
                    throw new Error('Máy chủ không trả về token hợp lệ');
                }
            } catch (err: any) {
                if (isMounted) {
                    const msg = err.response?.data?.message || err.message || 'Đăng nhập không thành công';
                    message.error(msg);
                    setErrorMessage(msg);
                    setTimeout(() => navigate('/login', { replace: true }), 2500);
                }
            }
        }

        function handleRedirect() {
            const pendingInviteToken = localStorage.getItem('pendingInviteToken');
            if (pendingInviteToken) {
                localStorage.removeItem('pendingInviteToken');
                navigate(`/accept-invite?token=${pendingInviteToken}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }

        processLogin();

        return () => {
            isMounted = false;
        };
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
                {errorMessage ? (
                    <>
                        <h2 className="text-2xl font-semibold text-red-600">Đăng nhập thất bại</h2>
                        <p className="mt-2 text-gray-600">{errorMessage}</p>
                        <p className="mt-4 text-sm text-gray-400">Đang chuyển hướng về trang đăng nhập...</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold text-gray-900">Đang xác thực tài khoản...</h2>
                        <p className="mt-2 text-gray-600">Vui lòng chờ trong giây lát.</p>
                    </>
                )}
            </div>
        </div>
    );
};
