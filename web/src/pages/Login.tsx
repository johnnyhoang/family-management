import { Button } from 'antd';
import { LogIn } from 'lucide-react';

export const Login = () => {
    const handleGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3173/api/v1';
        window.location.href = `${apiUrl}/auth/google`;
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
            {/* Background with overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/family_login_bg.png"
                    alt="Login Background"
                    className="w-full h-full object-cover opacity-40 blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-900/50 to-gray-900/80" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-500 rounded-2xl mb-6 shadow-lg shadow-sky-500/30">
                            <LogIn className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-sky-200/70">Manage your family assets and expenses with ease</p>
                    </div>

                    <div className="space-y-6">
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleGoogleLogin}
                            className="h-14 rounded-xl bg-white text-gray-900 border-none hover:!bg-gray-100 font-semibold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-6 h-6"
                            />
                            Continue with Google
                        </Button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-transparent text-white/30 uppercase tracking-widest font-medium">Safe & Secure</span>
                            </div>
                        </div>

                        <p className="text-center text-white/40 text-sm">
                            By continuing, you agree to our <br />
                            <button className="text-sky-400 hover:text-sky-300 underline transition-colors">Terms of Service</button> and <button className="text-sky-400 hover:text-sky-300 underline transition-colors">Privacy Policy</button>
                        </p>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
        </div>
    );
};
