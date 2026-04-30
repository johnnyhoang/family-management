import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useSession } from '../auth/SessionProvider';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
    const { activeFamilyName, role, systemRole } = useSession();

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-[rgba(255,251,247,0.92)] backdrop-blur-md border-b border-[rgba(242,214,197,0.72)] z-40 flex items-center justify-between px-3 lg:hidden shadow-[0_10px_24px_rgba(228,189,167,0.08)]">
            <Link
                to="/"
                className="flex items-center gap-3 rounded-2xl outline-offset-2 hover:opacity-90 transition-opacity"
            >
                <img
                    src="/logo.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-xl shrink-0 shadow-md shadow-[#f4b6a8]/30"
                />
                <div>
                    <h1 className="font-bold text-[15px] text-[#4f3f37] tracking-tight">Tài sản Gia đình</h1>
                    <p className="text-[11px] text-[#916e61] leading-none">
                        {systemRole === 'APP_ADMIN'
                            ? `${activeFamilyName || 'Quản trị ứng dụng'}${role && role !== 'APP_ADMIN' ? ` · ${role === 'FAMILY_ADMIN' ? 'Quản trị gia đình' : 'Thành viên'}` : ''}`
                            : `${activeFamilyName || 'Chưa chọn gia đình'} · ${role === 'FAMILY_ADMIN' ? 'Quản trị' : 'Thành viên'}`}
                    </p>
                </div>
            </Link>

            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-white rounded-xl transition-colors text-[#8c6d61] border border-[rgba(245,214,198,0.8)] shadow-sm"
                aria-label="Mở menu"
            >
                <Menu size={24} />
            </button>
        </header>
    );
};
