
import { X, Printer, ShoppingCart } from 'lucide-react';

export default function ShoppingListModal({ isOpen, onClose, lowStockProducts }) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <ShoppingCart className="text-red-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Lista de Compras Sugerida</h2>
                            <p className="text-sm text-slate-400">Productos con stock bajo o crítico</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 custom-scrollbar print-content">
                    {/* Print Header */}
                    <div className="print-header">
                        <h1>KontaFarm</h1>
                        <p>Reporte de Reabastecimiento - {new Date().toLocaleDateString()}</p>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay productos con bajo stock en este momento. ¡Buen trabajo!</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase">
                                    <th className="p-3">Producto</th>
                                    <th className="p-3 text-center">Laboratorio</th>
                                    <th className="p-3 text-center">Stock Actual</th>
                                    <th className="p-3 text-center">Mínimo</th>
                                    <th className="p-3 text-right">Sugerido (u)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {lowStockProducts.map((product) => {
                                    const minStock = product.min_stock || 5;
                                    const suggestedOrder = Math.max(0, (minStock * 2) - product.stock);

                                    return (
                                        <tr key={product.id} className="hover:bg-slate-800/30">
                                            <td className="p-3">
                                                <div className="font-bold text-white">{product.name}</div>
                                                <div className="text-xs text-slate-500">{product.presentation}</div>
                                            </td>
                                            <td className="p-3 text-center text-slate-400 text-sm">{product.lab || '-'}</td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded font-bold">
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-slate-400">{minStock}</td>
                                            <td className="p-3 text-right">
                                                <span className="font-mono text-emerald-400 font-bold text-lg">
                                                    {suggestedOrder}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 rounded-b-xl flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        Total Items: <span className="text-white font-bold">{lowStockProducts.length}</span>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Printer size={18} />
                        Imprimir Lista
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                /* Print Header Styles */
                .print-header {
                    display: none;
                }

                @media print {
                    .print-header {
                        display: block !important;
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .print-header h1 {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0;
                        color: #000;
                    }
                    .print-header p {
                        font-size: 14px;
                        color: #666;
                        margin: 5px 0 0 0;
                    }

                    body * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        color: black !important;
                        background: white !important;
                        padding: 20px; /* Add padding for print */
                    }
                    .print-content table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-content th, .print-content td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        color: black !important;
                    }
                    .print-content th {
                        background-color: #f2f2f2 !important;
                    }
                    /* Hide modal background and close buttons during print */
                    .fixed {
                        position: static !important;
                        background: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
