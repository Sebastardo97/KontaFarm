import { useState, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryService } from '../services/inventory';
import { getExpiryStatus, calculateDaysRemaining, formatDate } from '../utils/dateUtils';
import {
    AlertTriangle,
    Package,
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    MinusCircle,
    Clock
} from 'lucide-react';
import ShoppingListModal from '../components/ShoppingListModal';
import DispenseModal from '../components/DispenseModal';
import StockEntryModal from '../components/StockEntryModal';

const StatCard = ({ title, value, icon: Icon, gradient, subtext, onClick, isClickable }) => (
    <div
        className={`relative overflow-hidden rounded-2xl p-6 glass-panel border border-white/5 shadow-xl ${isClickable ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-200' : ''}`}
        onClick={onClick}
    >
        {/* Decorative background removed for clarity */}
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
                    <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-slate-300 font-medium text-xs uppercase tracking-wider">{title}</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            {subtext && <div className="text-xs text-slate-400 font-medium flex items-center gap-1">{subtext}</div>}
        </div>
    </div>
);

const QuickActionButton = ({ label, icon: Icon, color, onClick, desc }) => (
    <button
        onClick={onClick}
        className="group relative flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:bg-white/5 transition-all w-full text-left"
    >
        <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform shrink-0`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="font-bold text-white text-base">{label}</div>
            <div className="text-[11px] text-slate-400 leading-tight">{desc}</div>
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
            <ArrowUpRight size={16} />
        </div>
    </button>
);

export default function Dashboard() {
    const { products, loading: inventoryLoading } = useInventory();
    const [recentMovements, setRecentMovements] = useState([]);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [showDispenseModal, setShowDispenseModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);

    useEffect(() => {
        loadRecentActivity();
    }, []);

    const loadRecentActivity = async () => {
        try {
            const data = await InventoryService.getMovements();
            if (data) setRecentMovements(data.slice(0, 5));
        } catch (error) {
            console.error("Error loading recent activity:", error);
        }
    };

    if (inventoryLoading) return <div className="p-8 text-slate-400 animate-pulse">Cargando sistema...</div>;

    // Compute Stats
    const totalProducts = products.length;

    const expiringProducts = products.filter(p => {
        const status = getExpiryStatus(calculateDaysRemaining(p.expiry_date));
        return ['expired', 'critical', 'warning'].includes(status);
    }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    const expiredCount = products.filter(p => getExpiryStatus(calculateDaysRemaining(p.expiry_date)) === 'expired').length;
    const criticalCount = products.filter(p => getExpiryStatus(calculateDaysRemaining(p.expiry_date)) === 'critical').length;

    // Low Stock Logic
    const lowStockProducts = products.filter(p => p.stock <= (p.min_stock || 5));
    const lowStockCount = lowStockProducts.length;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <ShoppingListModal
                isOpen={showShoppingList}
                onClose={() => setShowShoppingList(false)}
                lowStockProducts={lowStockProducts}
            />

            {/* QUICK ACTIONS MODALS */}
            {showDispenseModal && (
                <DispenseModal
                    isOpen={showDispenseModal}
                    onClose={() => setShowDispenseModal(false)}
                    onSuccess={() => {
                        // Refresh data if needed, though Context usually handles product updates
                        // Ideally we reload recent movements here too
                        setTimeout(loadRecentActivity, 500);
                    }}
                />
            )}

            {showEntryModal && (
                <StockEntryModal
                    isOpen={showEntryModal}
                    onClose={() => setShowEntryModal(false)}
                    onSuccess={() => {
                        setTimeout(loadRecentActivity, 500);
                    }}
                />
            )}

            {/* HEADER & QUICK ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-6">
                        Panel de Control
                    </h2>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <StatCard
                            title="Total Catálogo"
                            value={totalProducts}
                            icon={Package}
                            gradient="from-blue-500 to-indigo-600"
                            subtext="Medicamentos registrados"
                        />
                        <StatCard
                            title="Atención Prioritaria"
                            value={expiringProducts.length}
                            icon={AlertTriangle}
                            gradient="from-amber-500 to-orange-600"
                            subtext={`${expiredCount} Vencidos • ${criticalCount} Críticos (< 6m)`}
                        />
                        <StatCard
                            title="Reabastecer"
                            value={lowStockCount}
                            icon={TrendingDown}
                            gradient="from-red-500 to-rose-600"
                            subtext="Click para ver Lista de Compras"
                            isClickable={true}
                            onClick={() => setShowShoppingList(true)}
                        />
                    </div>
                </div>

                {/* Quick Actions Sidebar (Desktop) / Top (Mobile) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Acciones Rápidas</h3>
                    <QuickActionButton
                        label="Salida / Entrega"
                        desc="Registrar dispensación a paciente"
                        icon={MinusCircle}
                        color="red"
                        onClick={() => setShowDispenseModal(true)}
                    />
                    <QuickActionButton
                        label="Entrada / Compra"
                        desc="Ingresar stock o nuevo lote"
                        icon={Plus}
                        color="emerald"
                        onClick={() => setShowEntryModal(true)}
                    />
                </div>
            </div>

            {/* SPLIT VIEW: RECENT ACTIVITY & UPCOMING EXPIRIES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* RECENT ACTIVITY FEED */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={20} className="text-emerald-400" />
                        <h3 className="text-xl font-bold text-white">Actividad Reciente</h3>
                    </div>
                    <div className="glass-panel p-0 overflow-hidden">
                        {recentMovements.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Sin movimientos recientes</div>
                        ) : (
                            <div className="divide-y divide-slate-700/50">
                                {recentMovements.map(move => (
                                    <div key={move.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${move.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {move.type === 'IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{move.products?.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {formatDate(move.created_at)} • {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">{move.quantity} Unid.</div>
                                            <div className="text-[10px] uppercase tracking-wide text-slate-500 truncate max-w-[100px]">
                                                {move.reason}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* UPCOMING EXPIRIES (Simplified Table) */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-amber-400" />
                        <h3 className="text-xl font-bold text-white">Alerta de Vencimientos</h3>
                    </div>
                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900/50">
                                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-3">Medicamento</th>
                                    <th className="p-3">Vence</th>
                                    <th className="p-3 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {expiringProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-6 text-center text-slate-500">
                                            Todo bajo control
                                        </td>
                                    </tr>
                                ) : (
                                    expiringProducts.slice(0, 5).map(product => {
                                        const days = calculateDaysRemaining(product.expiry_date);
                                        const status = getExpiryStatus(days);
                                        let color = status === 'expired' ? 'text-red-500' :
                                            status === 'critical' ? 'text-orange-400' : 'text-yellow-400';

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-800/30">
                                                <td className="p-3 font-medium text-slate-300">
                                                    {product.name}
                                                    <span className="block text-[10px] text-slate-500">{product.lot}</span>
                                                </td>
                                                <td className="p-3 text-sm text-slate-400">{product.expiry_date}</td>
                                                <td className="p-3 text-right">
                                                    <span className={`text-xs font-bold ${color}`}>
                                                        {status === 'expired' ? 'VENCIDO' : status === 'critical' ? '< 6 MESES' : '< 1 AÑO'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
