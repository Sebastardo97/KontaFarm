
import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { InventoryService } from '../services/inventory';
import { formatDate } from '../utils/dateUtils';
import { ActaGenerator } from '../services/ActaGenerator';

export default function Movements() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMovements();
    }, []);

    const loadMovements = async () => {
        try {
            const data = await InventoryService.getMovements();
            setMovements(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = movements.filter(m => {
        const search = searchTerm.toLowerCase();
        const productName = m.products?.name?.toLowerCase() || '';
        const patient = m.reason?.toLowerCase() || '';
        const code = m.products?.code?.toLowerCase() || '';
        const dateStr = new Date(m.created_at).toLocaleDateString();

        return productName.includes(search) ||
            patient.includes(search) ||
            code.includes(search) ||
            dateStr.includes(search);
    });

    const handlePrintReport = () => {
        if (searchTerm.trim() === '') {
            // Smart Logic: If empty, assume "Today's Shift"
            const today = new Date().toLocaleDateString();
            const todaysMovements = movements.filter(m =>
                new Date(m.created_at).toLocaleDateString() === today
            );

            if (todaysMovements.length === 0) {
                alert("No hay movimientos registrados para el día de hoy.");
                return;
            }
            ActaGenerator.generateBatchReport(todaysMovements, `Reporte de Turno (${today})`);
        } else {
            // Existing Logic: Print what is filtered
            ActaGenerator.generateBatchReport(filteredMovements, `Reporte Filtrado: "${searchTerm}"`);
        }
    };

    const exportToCSV = () => {
        if (!filteredMovements.length) return;

        const headers = ['Fecha', 'Hora', 'Tipo', 'Producto', 'Codigo', 'Cantidad', 'Responsable/Razon'];
        const csvContent = filteredMovements.map(m => [
            new Date(m.created_at).toLocaleDateString(),
            new Date(m.created_at).toLocaleTimeString(),
            m.type === 'IN' ? 'ENTRADA' : 'SALIDA',
            `"${m.products?.name || ''}"`, // Quote to handle commas
            m.products?.code || '',
            m.quantity,
            `"${m.reason || ''}"`
        ].join(',')).join('\n');

        const blob = new Blob([headers.join(',') + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `movimientos_kontafarm_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                        Historial de Movimientos
                    </h2>
                    <p className="text-slate-400 mt-1">Reporte detallado de entradas y salidas</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrintReport}
                        disabled={movements.length === 0} // Disabled only if NO movements at all
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                    >
                        <FileText size={20} />
                        {searchTerm ? 'Reporte Filtrado PDF' : 'Reporte Turno Hoy PDF'}
                    </button>
                    <button
                        onClick={exportToCSV}
                        disabled={filteredMovements.length === 0}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText size={20} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-panel p-4 flex items-center gap-3">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por paciente, medicamento o código..."
                    className="bg-transparent border-none outline-none text-slate-200 w-full placeholder-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="glass-panel overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Fecha / Hora</th>
                            <th className="p-4 font-medium">Tipo</th>
                            <th className="p-4 font-medium">Medicamento</th>
                            <th className="p-4 font-medium">Cantidad</th>
                            <th className="p-4 font-medium">Responsable / Paciente</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">Cargando historial...</td>
                            </tr>
                        ) : filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">No se encontraron movimientos.</td>
                            </tr>
                        ) : (
                            filteredMovements.map((move) => (
                                <tr key={move.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="text-white font-medium">
                                            {formatDate(move.created_at)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${move.type === 'IN'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {move.type === 'IN' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                            {move.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-emerald-400 font-medium">{move.products?.name}</div>
                                        <div className="text-xs text-slate-400">
                                            {move.products?.concentration} - {move.products?.presentation}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-white text-lg">{move.quantity}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-300">{move.reason}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
