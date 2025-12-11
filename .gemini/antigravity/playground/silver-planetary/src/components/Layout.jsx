
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Activity, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem = ({ icon: Icon, label, to, active }) => {
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${active
                    ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            style={{ textDecoration: 'none' }}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Package, label: 'Inventario', to: '/inventory' },
        { icon: Activity, label: 'Movimientos / Reportes', to: '/movements' },
        // { icon: FileText, label: 'Reportes', to: '/reports' },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 fixed h-full glass-panel border-r border-slate-800/50 hidden md:flex flex-col p-6 z-10"
                style={{ background: 'var(--color-bg-card)' }}>
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <Activity className="text-white" size={20} />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                        KontaFarm
                    </h1>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.to}
                            {...item}
                            active={location.pathname === item.to}
                        />
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-700/50">
                    <div className="mb-4 px-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Usuario</p>
                        <p className="text-sm font-medium text-white truncate text-ellipsis overflow-hidden" title={user?.email}>
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <p className="text-[10px] text-slate-600 text-center mt-4">v1.1.0 • Konta</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-full">
                {children}
            </main>
        </div>
    );
}
