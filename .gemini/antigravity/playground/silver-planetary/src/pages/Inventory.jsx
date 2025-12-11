
import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import ProductModal from '../components/ProductModal';
import DispenseModal from '../components/DispenseModal';
import StockEntryModal from '../components/StockEntryModal';
import ShoppingListModal from '../components/ShoppingListModal';
import { getExpiryStatus, calculateDaysRemaining } from '../utils/dateUtils';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, AlertCircle, Calendar, Clock, Edit, MinusCircle, Package, ShoppingCart } from 'lucide-react';

export default function Inventory() {
    const { products } = useInventory();
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [dispenseItem, setDispenseItem] = useState(null);
    const [stockEntryModalOpen, setStockEntryModalOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    // Shopping List State
    const [shoppingListOpen, setShoppingListOpen] = useState(false);
    const [lowStockItems, setLowStockItems] = useState([]);

    // Verify products is array
    const safeProducts = Array.isArray(products) ? products : [];

    // Grouping Logic
    const groupedProducts = safeProducts.reduce((acc, product) => {
        if (!acc[product.code]) {
            acc[product.code] = [];
        }
        acc[product.code].push(product);
        return acc;
    }, {});

    const toggleGroup = (code) => {
        setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    // Generate Shopping List Logic
    const handleGenerateShoppingList = () => {
        // Aggregate stock by code (product definition) to see real total available
        const stockByCode = {};

        // 1. Calculate total stock per product code
        safeProducts.forEach(product => {
            if (!stockByCode[product.code]) {
                stockByCode[product.code] = {
                    ...product,
                    totalStock: 0
                };
            }
            stockByCode[product.code].totalStock += (product.stock || 0);
        });

        // 2. Filter items below min_stock
        const itemsToBuy = Object.values(stockByCode)
            .filter(item => {
                const minStock = item.min_stock || 10; // Default min 10 if not set
                // Use the aggregated TOTAL stock for the decision, not just one lot
                return item.totalStock <= minStock;
            })
            .map(item => ({
                id: item.code, // Use code as ID for the shopping list to avoid dupes
                name: item.name,
                presentation: item.presentation,
                lab: item.lab,
                stock: item.totalStock,
                min_stock: item.min_stock || 10
            }));

        setLowStockItems(itemsToBuy);
        setShoppingListOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Inventario Agrupado</h2>
                <div className="flex gap-3">
                    <button onClick={handleGenerateShoppingList} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-2 shadow-lg">
                        <ShoppingCart size={20} />
                        Generar Lista
                    </button>
                    <button onClick={() => setStockEntryModalOpen(true)} className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20">
                        <Package size={20} />
                        Entrada / Compra
                    </button>
                    <button onClick={() => { setDispenseItem(null); setDispenseModalOpen(true); }} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2">
                        <MinusCircle size={20} className="text-red-400" />
                        Salida Rápida
                    </button>
                    <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-emerald-900/20">
                        + Nuevo Producto
                    </button>
                </div>
            </div>

            {showModal && <ProductModal onClose={handleCloseModal} initialData={editingProduct} />}
            {stockEntryModalOpen && <StockEntryModal onClose={() => setStockEntryModalOpen(false)} />}
            {shoppingListOpen && (
                <ShoppingListModal
                    isOpen={shoppingListOpen}
                    onClose={() => setShoppingListOpen(false)}
                    lowStockProducts={lowStockItems}
                />
            )}

            {(dispenseModalOpen || dispenseItem) && (
                <DispenseModal
                    product={dispenseItem}
                    onClose={() => {
                        setDispenseItem(null);
                        setDispenseModalOpen(false);
                    }}
                />
            )}

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-sm uppercase">
                            <th className="p-4 w-12"></th>
                            <th className="p-4">Código</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4">Stock Total</th>
                            <th className="p-4">Estado General</th>
                            <th className="p-4 text-right">Lotes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {Object.keys(groupedProducts).length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500">
                                    No hay productos registrados o error cargando.
                                </td>
                            </tr>
                        )}

                        {Object.entries(groupedProducts).map(([code, items]) => {
                            const isExpanded = expandedGroups[code];
                            const firstItem = items[0];
                            const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
                            const totalLots = items.length;

                            let minDays = Infinity;
                            items.forEach(item => {
                                const days = calculateDaysRemaining(item.expiry_date);
                                if (days < minDays) minDays = days;
                            });

                            const status = getExpiryStatus(minDays);
                            const statusColor = {
                                'expired': 'bg-red-600 text-white shadow-lg shadow-red-900/50',
                                'critical': 'bg-red-600 text-white shadow-lg shadow-red-900/50',
                                'warning': 'bg-orange-500 text-white shadow-lg shadow-orange-900/50',
                                'good': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }[status] || 'bg-slate-500 text-white';

                            const statusLabel = {
                                'expired': 'VENCIDO - REVISAR',
                                'critical': 'ALERTA (< 6m)',
                                'warning': 'ATENCIÓN (6-12m)',
                                'good': 'VIGENTE'
                            }[status] || 'DESCONOCIDO';

                            return (
                                <div key={code} style={{ display: 'contents' }}>
                                    <tr
                                        onClick={() => toggleGroup(code)}
                                        className={`cursor-pointer hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-slate-800/30' : ''}`}
                                    >
                                        <td className="p-4 text-slate-500">
                                            {isExpanded ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} className="rotate-90" />}
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm font-mono">{code}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-white">{firstItem.name}</div>
                                            {firstItem.commercial_name && <div className="text-sm text-emerald-400">{firstItem.commercial_name}</div>}
                                            <div className="text-xs text-slate-500 mt-1">{firstItem.presentation}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xl font-bold text-white">{totalStock}</span>
                                            <span className="text-xs text-slate-500 ml-1">unid.</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                                                {totalLots} {totalLots === 1 ? 'Lote' : 'Lotes'}
                                            </span>
                                        </td>
                                    </tr>

                                    {isExpanded && items.map(item => {
                                        const itemDays = calculateDaysRemaining(item.expiry_date);
                                        const itemStatus = getExpiryStatus(itemDays);
                                        const itemStatusColor = {
                                            'expired': 'text-red-500 font-bold',
                                            'critical': 'text-red-500 font-bold',
                                            'warning': 'text-orange-500 font-bold',
                                            'good': 'text-emerald-400'
                                        }[itemStatus] || 'text-slate-400';

                                        return (
                                            <tr key={item.id} className="bg-slate-900/50 border-b border-slate-800/50">
                                                <td colSpan="2"></td>
                                                <td className="p-4 pl-8 border-l-2 border-slate-700">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                                            <span>Lote: <span className="font-mono text-white">{item.lot}</span></span>
                                                        </div>
                                                        {(item.lab || item.sanitary_register) && (
                                                            <div className="text-xs text-slate-500 flex gap-2">
                                                                {item.lab && <span>Lab: <span className="text-slate-400">{item.lab}</span></span>}
                                                                {item.sanitary_register && <span>Invima: <span className="text-slate-400">{item.sanitary_register}</span></span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-300">
                                                    {item.stock} un.
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-500" />
                                                        <span className={itemStatusColor}>Vence: {item.expiry_date}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 flex justify-end gap-2 pr-8">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDispenseItem(item); }}
                                                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                                                        title="Dispensar este lote"
                                                    >
                                                        <MinusCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                        className="p-1.5 bg-slate-700 text-slate-400 hover:bg-blue-500 hover:text-white rounded transition-colors"
                                                        title="Editar este lote"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
