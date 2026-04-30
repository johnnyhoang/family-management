import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

export const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="page-shell min-h-screen flex flex-col lg:flex-row">
            {/* Mobile Header */}
            <MobileHeader onMenuClick={toggleSidebar} />

            {/* Sidebar - Desktop (fixed) and Mobile (Drawer-like overlay) */}
            <div className={`
                fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0
                transition-all duration-300 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                <Sidebar onClose={closeSidebar} />
            </div>

            {/* Main Content */}
            <main className="relative flex-1 w-full min-h-screen lg:min-w-0 overflow-x-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-80">
                    <div className="absolute left-8 top-6 hidden h-24 w-24 rounded-[28px] border border-white/70 bg-white/40 blur-[2px] lg:block" />
                    <div className="absolute bottom-16 right-12 hidden h-16 w-16 rounded-[22px] border border-white/70 bg-[rgba(255,242,231,0.7)] lg:block" />
                </div>
                <div className="relative p-3 lg:p-4 max-w-7xl mx-auto pt-20 lg:pt-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
