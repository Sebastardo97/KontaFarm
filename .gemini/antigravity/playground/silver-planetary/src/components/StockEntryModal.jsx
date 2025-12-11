import { useState, useRef, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
// import { ActaGenerator } from '../services/ActaGenerator';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Search, Camera, CameraOff, Package, ArrowRight, Save, CheckCircle, AlertTriangle } from 'lucide-react';

export default function StockEntryModal({ onClose }) {
    const { products, addStockEntry } = useInventory();
    const { user } = useAuth(); // Get current user for the report

    // Steps: 1 = Search, 2 = Entry Details, 3 = Technical Check
    const [step, setStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Selection
    const [selectedCode, setSelectedCode] = useState(null);
    const [existingLots, setExistingLots] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        isNewLot: false,
        lot: '',
        expiry_date: '',
        quantity: '',
        person: user?.email || '', // Default to current user
        reason: '',
        // Invima Checks
        invima_packaging: true,
        invima_labeling: true,
        invima_temperature: 'N/A',
        lab: '',
        invima: ''
    });

    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Auto-focus logic
    useEffect(() => {
        if (step === 1 && !isScanning && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [step, isScanning]);

    // Handle Search
    const handleSearch = (e) => {
        e.preventDefault();
        const term = searchQuery.toLowerCase().trim();
        if (!term) return;

        const matches = products.filter(p =>
            p.code.toLowerCase().includes(term) ||
            p.name.toLowerCase().includes(term) ||
            p.commercial_name?.toLowerCase().includes(term)
        );

        const uniqueMatches = [];
        const seenCodes = new Set();

        matches.forEach(p => {
            if (!seenCodes.has(p.code)) {
                seenCodes.add(p.code);
                uniqueMatches.push(p);
            }
        });

        if (uniqueMatches.length === 0) {
            alert('No se encontraron productos. Si es nuevo, use el botón "+ Nuevo Producto".');
        } else if (uniqueMatches.length === 1) {
            selectProduct(uniqueMatches[0]);
        } else {
            setSearchResults(uniqueMatches);
        }
    };

    const selectProduct = (product) => {
        const lots = products.filter(p => p.code === product.code);
        setSelectedCode(product);
        setExistingLots(lots);
        setStep(2);
        setFormData(prev => ({
            ...prev,
            lot: '',
            expiry_date: '',
            isNewLot: false,
            invima_packaging: true,
            invima_labeling: true,
            lab: product.lab || '',
            invima: product.sanitary_register || ''
        }));
    };

    // Scanner
    const startScanner = () => {
        setIsScanning(true);
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render((decodedText) => {
                setSearchQuery(decodedText);
                stopScanner();
            }, (error) => console.warn(error));
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) scannerRef.current.clear().catch(console.error);
        setIsScanning(false);
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // If coming from Step 2, go to Step 3 (Technical Check)
        if (step === 2) {
            setStep(3);
            return;
        }

        // Final Submit (Step 3)
        setLoading(true);
        try {
            // 1. Save to Database
            await addStockEntry({
                code: selectedCode.code,
                lot: formData.lot.toUpperCase(),
                expiry_date: formData.expiry_date,
                quantity: formData.quantity,
                person: formData.person || user?.email,
                reason: formData.reason,
                lab: formData.lab,
                sanitary_register: formData.invima
            });

            // 2. Generate PDF Report (DISABLED)
            // try {
            //     ActaGenerator.generate(formData, selectedCode, { email: formData.person || user?.email });
            // } catch (pdfErr) {
            //     console.error("PDF Fail", pdfErr);
            //     alert("Guardado correctamente, pero falló la generación del PDF.");
            // }

            onClose();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLotSelection = (lotName, expiry) => {
        setFormData(prev => ({
            ...prev,
            lot: lotName,
            expiry_date: expiry,
            isNewLot: false
        }));
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg bg-slate-900 border border-emerald-500/30 shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-emerald-500/20 bg-emerald-900/10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Package size={24} className="text-emerald-400" />
                            Entrada de Mercancía
                        </h2>
                        <div className="flex gap-2 mt-2">
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">

                    {/* STEP 1: SEARCH */}
                    {step === 1 && (
                        <div className="p-6">
                            {isScanning ? (
                                <div className="space-y-4">
                                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-emerald-500/50 bg-black"></div>
                                    <button onClick={stopScanner} className="w-full bg-slate-700 p-3 rounded-lg text-white flex justify-center gap-2">
                                        <CameraOff /> Cancelar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <form onSubmit={handleSearch} className="space-y-4">
                                        <div className="relative">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Escanear o buscar código/nombre..."
                                                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 pl-12 text-lg text-white outline-none focus:border-emerald-500 shadow-inner"
                                                autoFocus
                                            />
                                            <Search className="absolute left-4 top-4.5 text-slate-500" size={20} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20">
                                                Buscar <ArrowRight size={20} />
                                            </button>
                                            <button type="button" onClick={startScanner} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                                                <Camera size={20} /> Escanear
                                            </button>
                                        </div>
                                    </form>

                                    {searchResults.length > 0 && (
                                        <div className="mt-6 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                            <h3 className="text-sm text-slate-400 uppercase font-bold mb-2">Resultados ({searchResults.length})</h3>
                                            {searchResults.map(p => (
                                                <button
                                                    key={p.code}
                                                    onClick={() => selectProduct(p)}
                                                    className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">{p.name}</div>
                                                        <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                                                    </div>
                                                    <div className="text-slate-500 group-hover:text-emerald-400">Seleccionar →</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ENTRY FORM */}
                    {step === 2 && selectedCode && (
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Product Summary */}
                            <div className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-start border-l-4 border-emerald-500">
                                <div>
                                    <h3 className="font-bold text-white">{selectedCode.name}</h3>
                                    <p className="text-sm text-slate-400">{selectedCode.presentation}</p>
                                </div>
                                <button type="button" onClick={() => setStep(1)} className="text-xs text-blue-400 hover:text-blue-300">
                                    Cambiar
                                </button>
                            </div>

                            {/* Lot Selection */}
                            <div className="space-y-3">
                                <label className="text-sm text-slate-400 font-medium">Lote & Vencimiento</label>

                                {!formData.isNewLot && existingLots.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {existingLots.map(lot => (
                                            <button key={lot.id} type="button" onClick={() => handleLotSelection(lot.lot, lot.expiry_date)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${formData.lot === lot.lot ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                                                {lot.lot}
                                            </button>
                                        ))}
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, isNewLot: true, lot: '', expiry_date: '' }))}
                                            className="px-3 py-1.5 rounded-lg text-xs border border-dashed border-slate-500 text-slate-400 hover:text-white hover:border-white transition-colors">
                                            + Nuevo
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Número de Lote</label>
                                        <input required type="text" value={formData.lot} onChange={e => setFormData({ ...formData, lot: e.target.value.toUpperCase() })}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 uppercase font-mono tracking-wider"
                                            placeholder="EJ: A123"
                                            readOnly={!formData.isNewLot && existingLots.some(l => l.lot === formData.lot)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Fecha Vencimiento</label>
                                        <input required={formData.isNewLot} type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className={`w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 ${!formData.isNewLot ? 'opacity-50' : ''}`}
                                            readOnly={!formData.isNewLot}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">Cantidad a Ingresar</label>
                                <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-2xl font-bold text-white outline-none focus:border-emerald-500"
                                    placeholder="0" autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Laboratorio</label>
                                    <input value={formData.lab} onChange={e => setFormData({ ...formData, lab: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm"
                                        placeholder="Ej. Genfar"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Registro INVIMA</label>
                                    <input value={formData.invima} onChange={e => setFormData({ ...formData, invima: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm"
                                        placeholder="Ej. 2023M-000123"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">Origen / Proveedor</label>
                                <input value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500"
                                    placeholder="Ej. Droguería Principal"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2">
                                    Siguiente <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: TECHNICAL CHECK */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex items-center gap-3 mb-4 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                                <CheckCircle className="text-emerald-400" size={32} />
                                <div>
                                    <h3 className="font-bold text-white">Inspección Técnica (INVIMA)</h3>
                                    <p className="text-xs text-slate-400">Verifique el estado del producto antes de aceptarlo.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 border border-slate-700">
                                    <span className="text-white font-medium">1. Embalaje y Sellos de Seguridad</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.invima_packaging}
                                        onChange={e => setFormData({ ...formData, invima_packaging: e.target.checked })}
                                        className="w-6 h-6 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 border border-slate-700">
                                    <span className="text-white font-medium">2. Rotulado y Vigencia de Lote</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.invima_labeling}
                                        onChange={e => setFormData({ ...formData, invima_labeling: e.target.checked })}
                                        className="w-6 h-6 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </label>

                                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                                    <span className="text-white font-medium block mb-2">3. Cadena de Frío / Temperatura</span>
                                    <input
                                        type="text"
                                        value={formData.invima_temperature}
                                        onChange={e => setFormData({ ...formData, invima_temperature: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white"
                                        placeholder="Temp °C o N/A"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/10 p-3 rounded-lg text-xs text-blue-300 flex gap-2">
                                <CheckCircle size={16} />
                                <span>Al guardar, se generará automáticamente el PDF del Acta de Recepción.</span>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50">
                                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 text-slate-400 hover:text-white">Atrás</button>
                                <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2">
                                    {loading ? 'Procesando...' : <><Save size={20} /> Guardar y Generar Acta</>}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
