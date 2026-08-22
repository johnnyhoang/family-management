import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useSession } from '../auth/SessionProvider';

// GoUS gets its own shell (no family-dashboard sidebar) so it reads as a
// standalone portal. GoUsPortal itself already renders a full hero header,
// so this bar stays a slim utility strip — back link, family switcher, logout.
export const GoUsLayout = () => {
    const navigate = useNavigate();
    const { activeFamilyId, activeFamilyName, memberships, switchFamily, isSwitchingFamily } = useSession();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f6f3ef]">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:px-4">
                    <Link
                        to="/"
                        title="Về Tài sản Gia đình"
                        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Tài sản Gia đình</span>
                    </Link>

                    <div className="flex-1" />

                    {memberships.length > 0 ? (
                        <Select
                            value={activeFamilyId ?? undefined}
                            placeholder={activeFamilyName ?? 'Chọn gia đình'}
                            size="small"
                            className="w-36 sm:w-52"
                            loading={isSwitchingFamily}
                            onChange={(value) => switchFamily(value)}
                            options={memberships.map((membership) => ({
                                value: membership.familyId,
                                label: membership.familyName,
                            }))}
                        />
                    ) : null}

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Đăng xuất"
                        aria-label="Đăng xuất"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-colors"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
                <Outlet />
            </main>
        </div>
    );
};
