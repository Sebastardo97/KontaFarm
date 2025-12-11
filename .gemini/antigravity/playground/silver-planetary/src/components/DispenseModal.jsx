
import { useState, useEffect, useRef } from 'react';
import { X, MinusCircle, Search, ArrowRight, AlertTriangle, Calendar, Package, Camera, CameraOff, CheckCircle, FileText } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { InventoryService } from '../services/inventory';
import { ActaGenerator } from '../services/ActaGenerator';
import { useInventory } from '../contexts/InventoryContext';
import { calculateDaysRemaining, getExpiryStatus } from '../utils/dateUtils';

export default function DispenseModal({ product: initialProduct, onClose }) {
    const { products, refreshProducts } = useInventory();
    const [selectedProduct, setSelectedProduct] = useState(initialProduct);
    const [searchCode, setSearchCode] = useState('');
    const [foundMatches, setFoundMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    // Steps: 1=Search, 1.5=Select Lot, 2=Dispense Form, 3=Success
    const [step, setStep] = useState(initialProduct ? 2 : 1);
    const [successData, setSuccessData] = useState(null);
    const searchInputRef = useRef(null);

    // Focus search input on mount if starting at step 1
    useEffect(() => {
        if (step === 1 && !isScanning && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [step, isScanning]);

    // Cleanup scanner on unmount or when scanning stops
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, []);

    const startScanner = () => {
        setIsScanning(true);
        // Small delay to ensure DOM element exists
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                setIsScanning(false);
            }).catch(err => {
                console.error("Failed to clear scanner", err);
                setIsScanning(false);
            });
        } else {
            setIsScanning(false);
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        // Handle the scanned code
        setSearchCode(decodedText);
        stopScanner();
        // Trigger search logic directly
        performSearch(decodedText);
    };

    const onScanFailure = (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    };

    const [formData, setFormData] = useState({
        quantity: '',
        reason: '',
        person: ''
    });

    const performSearch = (codeToSearch) => {
        const term = codeToSearch.toLowerCase().trim();

        // Find ALL matches (by Code OR Lot)
        const matches = products.filter(p =>
            p.code.toLowerCase() === term ||
            p.lot.toLowerCase().includes(term)
        );

        if (matches.length === 0) {
            alert('❌ ERROR: No existe ningún producto con ese Código o Lote en el sistema.\n\nDebe registrar la entrada del lote antes de poder dispensarlo.');
            if (!isScanning) setSearchCode('');
        } else if (matches.length === 1) {
            // Only one lot exists, select it automatically
            setSelectedProduct(matches[0]);
            setStep(2);
            setSearchCode('');
        } else {
            // Multiple lots found, sort by expiry date (FEFO - First Expired First Out)
            const sortedMatches = matches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
            setFoundMatches(sortedMatches);
            setStep(1.5); // Go to selection step
            setSearchCode('');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(searchCode);
    };

    const handleSelectLot = (product) => {
        setSelectedProduct(product);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct) return;

        if (parseInt(formData.quantity) > selectedProduct.stock) {
            alert('Error: La cantidad a retirar excede el stock actual de este lote.');
            return;
        }

        setLoading(true);
        try {
            await InventoryService.registerMovement({
                product_id: selectedProduct.id,
                type: 'OUT',
                quantity: parseInt(formData.quantity),
                reason: `${formData.person} - ${formData.reason}`
            });
            await refreshProducts();
            // Store data for receipt and show success step
            setSuccessData({
                product: selectedProduct,
                quantity: parseInt(formData.quantity),
                person: formData.person,
                reason: formData.reason,
                date: new Date()
            });
            setStep(3);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetSearch = () => {
        setSelectedProduct(null);
        setFoundMatches([]);
        setStep(1);
        setIsScanning(false);
        setFormData({ quantity: '', reason: '', person: '' });
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`glass-panel w-full ${isScanning ? 'max-w-2xl' : 'max-w-lg'} relative bg-slate-900 border border-slate-700 shadow-2xl transition-all duration-300`}>

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {step === 1 ? <Search size={24} className="text-blue-400" /> :
                                step === 3 ? <CheckCircle size={24} className="text-emerald-400" /> :
                                    <MinusCircle size={24} className="text-red-400" />}

                            {step === 1 ? 'Buscar Producto' :
                                step === 1.5 ? 'Seleccionar Lote' :
                                    step === 3 ? 'Dispensación Exitosa' :
                                        'Salida de Inventario'}
                        </h2>
                        {step === 2 && selectedProduct && (
                            <p className="text-sm text-emerald-400 mt-1">{selectedProduct.name} {selectedProduct.concentration}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Step 1: Search Form */}
                {step === 1 && (
                    <div className="p-8">
                        {isScanning ? (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div id="reader" className="overflow-hidden rounded-xl border-2 border-slate-600 bg-black"></div>
                                <button
                                    onClick={stopScanner}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-medium"
                                >
                                    <CameraOff size={20} /> Cancelar Cámara
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="block text-sm text-slate-400 mb-2">Escanee LOTE o CÓDIGO del producto:</label>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchCode}
                                        onChange={(e) => setSearchCode(e.target.value)}
                                        className="w-full bg-slate-800 border-2 border-slate-600 focus:border-blue-500 rounded-xl p-4 text-center text-2xl font-mono text-white tracking-widest outline-none transition-colors placeholder:text-slate-600"
                                        placeholder="CÓDIGO / LOTE"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                                        Buscar <ArrowRight size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startScanner}
                                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors border border-slate-600"
                                    >
                                        <Camera size={20} /> Escanear
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Step 1.5: Select Lot (Multi-Lot Found) */}
                {step === 1.5 && (
                    <div className="p-6">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3 mb-4">
                            <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-yellow-200">
                                <span className="font-bold block">¡Múltiples lotes encontrados!</span>
                                Seleccione el lote del cual va a retirar el producto. Se recomienda usar el próximo a vencer.
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <h3 className="text-white font-bold text-lg sticky top-0 bg-slate-900 py-2 z-10">{foundMatches[0]?.name}</h3>
                            {foundMatches.map((match, index) => {
                                const days = calculateDaysRemaining(match.expiry_date);
                                const status = getExpiryStatus(days);
                                const isBestOption = index === 0;

                                return (
                                    <button
                                        key={match.id}
                                        onClick={() => handleSelectLot(match)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all relative group ${isBestOption
                                            ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20'
                                            : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                            }`}
                                    >
                                        {isBestOption && (
                                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                                RECOMENDADO
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Package size={16} />
                                                <span className="font-mono text-sm">Lote: {match.lot}</span>
                                            </div>
                                            <span className="font-bold text-white text-lg group-hover:scale-110 transition-transform">{match.stock} un.</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar size={16} className={status === 'critical' ? 'text-red-400' : 'text-slate-400'} />
                                            <span className={status === 'critical' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                                Vence: {match.expiry_date}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-700">
                            <button type="button" onClick={resetSearch} className="text-slate-400 hover:text-white text-sm">
                                ← Volver a buscar
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success & Download */}
                {step === 3 && successData && (
                    <div className="p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">¡Salida Registrada!</h3>
                        <p className="text-slate-400 mb-8">
                            Se han descontado {successData.quantity} unidades del inventario correctamente.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => ActaGenerator.generateDispensationReport(successData)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                            >
                                <FileText size={20} />
                                Descargar Comprobante PDF
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Dispense Form */}
                {step === 2 && selectedProduct && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4" key={selectedProduct.id}>

                        <div className="flex gap-4">
                            <div className="flex-1 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-400 mb-1">Stock Lote Actual</span>
                                <span className="text-2xl font-bold text-white">{selectedProduct.stock}</span>
                            </div>
                            <div className="flex-1 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-400 mb-1">Posición/Lote</span>
                                <span className="text-sm font-medium text-slate-200 truncate">{selectedProduct.lot}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Cantidad a Retirar</label>
                            <input required type="number" min="1" max={selectedProduct.stock}
                                value={formData.quantity}
                                autoFocus
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-lg outline-none focus:border-red-500" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Paciente / Destino</label>
                            <input required
                                value={formData.person}
                                onChange={e => setFormData({ ...formData, person: e.target.value })}
                                placeholder="Ej. Juan Perez"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-red-500" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Servicio / Nota</label>
                            <input required
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Ej. Urgencias / Consulta Externa"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-red-500" />
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-4">
                            {!initialProduct && (
                                <button type="button" onClick={resetSearch} className="mr-auto text-sm text-blue-400 hover:text-blue-300 underline">
                                    ← Buscar otro
                                </button>
                            )}
                            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">
                                Cancelar
                            </button>
                            <button disabled={loading} type="submit" className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20">
                                <MinusCircle size={20} />
                                {loading ? '...' : 'Confirmar Salida'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
