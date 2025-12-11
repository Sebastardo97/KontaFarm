
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-10">
                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 mb-6 shadow-lg shadow-blue-500/20">
                        <Activity className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent mb-2">
                        KontaFarm
                    </h1>
                    <p className="text-slate-400 text-sm">Sistema de Gestión Farmacéutica</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="usuario@konta.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Ingresando...' : (
                            <>
                                Iniciar Sesión <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-900/80 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        &copy; 2025 Konta Pharma. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
