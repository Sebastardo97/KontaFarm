
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
    console.log('🚀 KontaFarm Login v3.0 - Tailwind Restoration Deploy');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Credenciales incorrectas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-300"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse delay-500"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Glassmorphic Card */}
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-50" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>

                    {/* Header with Logo */}
                    <div className="p-10 pb-6 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-6 shadow-xl shadow-emerald-500/30 animate-float">
                            <Activity className="text-white" size={40} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-3 tracking-tight">
                            KontaFarm
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">Sistema de Gestión Farmacéutica</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-6">

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm text-center backdrop-blur-sm animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
                                <Mail size={14} className="text-emerald-400" />
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all duration-200 font-medium"
                                    placeholder="usuario@konta.com"
                                    style={{ color: 'white' }}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
                                <Lock size={14} className="text-emerald-400" />
                                Contraseña
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all duration-200 font-medium"
                                    placeholder="••••••••"
                                    style={{ color: 'white' }}
                                />
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Ingresando...
                                </div>
                            ) : (
                                <>
                                    Iniciar Sesión <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <a href="#" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-10 py-5 bg-white/5 border-t border-white/5 text-center backdrop-blur-sm">
                        <p className="text-xs text-slate-500 font-medium">
                            © 2025 Konta Pharma. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
