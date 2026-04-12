import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:hidden">
            <div className="flex items-center gap-3">
                <img
                    src="/logo.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg shrink-0"
                />
                <h1 className="font-bold text-base text-slate-800 tracking-tight">FamilyAsset</h1>
            </div>

            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                aria-label="Open menu"
            >
                <Menu size={24} />
            </button>
        </header>
    );
};
