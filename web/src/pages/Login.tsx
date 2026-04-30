import { Button } from 'antd';
import { LogIn } from 'lucide-react';
import { apiBaseUrl } from '../api/client';

export const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = `${apiBaseUrl}/auth/google`;
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fffaf5]">
            <div className="absolute inset-0 z-0">
                <img
                    src="/family_login_bg.png"
                    alt="Hình nền đăng nhập"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,242,0.76),rgba(250,255,252,0.9))]" />
                <div className="absolute inset-0 bg-[url('/cute-pattern.svg')] bg-[length:240px_240px] opacity-40" />
            </div>

            <div className="relative z-10 w-full max-w-5xl p-6 lg:p-8">
                <div className="grid overflow-hidden rounded-[32px] border border-white/70 bg-white/78 shadow-[0_28px_60px_rgba(225,183,156,0.2)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="hidden bg-[linear-gradient(180deg,#fff6f0,#f5fcf8)] p-8 lg:block">
                        <div className="flex h-full flex-col justify-between">
                            <div>
                                <span className="cute-chip">Quản lý gia đình theo cách dịu mắt hơn</span>
                                <h2 className="mt-4 text-3xl font-bold leading-tight text-[#4d3b35]">Một góc nhỏ để tài sản, thu chi và lịch nhà luôn gọn gàng.</h2>
                                <p className="mt-3 text-sm leading-6 text-[#7f675c]">
                                    Giao diện được làm mềm hơn để mỗi lần mở app đều dễ chịu, nhưng vẫn đủ rõ để thao tác nhanh.
                                </p>
                            </div>
                            <img
                                src="/family-soft-illustration.svg"
                                alt="Minh họa gia đình"
                                className="mt-8 h-[260px] w-full rounded-[28px] object-cover"
                            />
                        </div>
                    </div>
                    <div className="p-8 lg:p-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-[linear-gradient(135deg,#ff9f90,#f97370)] rounded-[24px] mb-6 shadow-lg shadow-[#f4b2a2]/40">
                                <LogIn className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-[#4d3b35] mb-2">Chào mừng quay lại</h1>
                            <p className="text-[#86695d]">Quản lý tài sản và thu chi gia đình theo cách nhẹ nhàng hơn</p>
                        </div>

                        <div className="space-y-6">
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleGoogleLogin}
                                className="h-14 rounded-2xl !bg-[linear-gradient(135deg,#ff9f90,#f97370)] text-white border-none hover:brightness-105 font-semibold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_14px_28px_rgba(249,115,112,0.24)]"
                            >
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Đăng nhập với Google"
                                    className="w-6 h-6 rounded-full bg-white p-0.5"
                                />
                                Tiếp tục với Google
                            </Button>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#f1d7cb]"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-transparent text-[#b08a79] uppercase tracking-[0.25em] font-medium">An toàn và bảo mật</span>
                                </div>
                            </div>

                            <p className="text-center text-[#8f7367] text-sm leading-6">
                                Khi tiếp tục, bạn đồng ý với <br />
                                <button className="text-[#d56f63] hover:text-[#be5d55] underline transition-colors">Điều khoản dịch vụ</button> và <button className="text-[#d56f63] hover:text-[#be5d55] underline transition-colors">Chính sách riêng tư</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
