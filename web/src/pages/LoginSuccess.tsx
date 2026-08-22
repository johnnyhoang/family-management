import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            const pendingInviteToken = localStorage.getItem('pendingInviteToken');
            if (pendingInviteToken) {
                localStorage.removeItem('pendingInviteToken');
                navigate(`/accept-invite?token=${pendingInviteToken}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900">Đang đăng nhập...</h2>
                <p className="mt-2 text-gray-600">Vui lòng chờ trong giây lát.</p>
            </div>
        </div>
    );
};
