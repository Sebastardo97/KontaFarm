
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Camera, CameraOff, ScanText, Loader2, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useInventory } from '../contexts/InventoryContext';
import { analyzeProductImage } from '../services/aiScanner';

export default function ProductModal({ onClose, initialData = null }) {
    const { addProduct, updateProduct, removeProduct } = useInventory();
    const [loading, setLoading] = useState(false);

    // Scanner State (Barcode)
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    // AI Vision State
    const [isAI, setIsAI] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        commercial_name: '',
        concentration: '',
        presentation: '',
        lab: '',
        sanitary_register: '',
        lot: '',
        expiry_date: '',
        stock: '',
        min_stock: '10'
    });

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Ensure nulls are empty strings
                commercial_name: initialData.commercial_name || '',
                concentration: initialData.concentration || '',
                presentation: initialData.presentation || '',
                lab: initialData.lab || '',
                sanitary_register: initialData.sanitary_register || '',
            });
        }
    }, [initialData]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
            stopAI();
        };
    }, []);

    // --- BARCODE SCANNER LOGIC ---
    const startScanner = () => {
        setIsScanning(true);
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader-product",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => setIsScanning(false)).catch(() => setIsScanning(false));
        } else {
            setIsScanning(false);
        }
    };

    const onScanSuccess = (decodedText) => {
        setFormData(prev => ({ ...prev, code: decodedText }));
        stopScanner();
    };

    const onScanFailure = (error) => { };

    // --- AI VISION LOGIC ---
    const startAI = async () => {
        setIsAI(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera for AI:", err);
            alert("No se pudo acceder a la cámara para la IA.");
            setIsAI(false);
        }
    };

    const stopAI = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsAI(false);
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setAiLoading(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.8);

        try {
            const aiData = await analyzeProductImage(base64Image);

            // Populate form with AI findings
            const updates = {};
            if (aiData.code) updates.code = aiData.code;
            if (aiData.name) updates.name = aiData.name;
            if (aiData.commercial_name) updates.commercial_name = aiData.commercial_name;
            if (aiData.concentration) updates.concentration = aiData.concentration;
            if (aiData.presentation) updates.presentation = aiData.presentation;
            if (aiData.lab) updates.lab = aiData.lab;
            if (aiData.sanitary_register) updates.sanitary_register = aiData.sanitary_register;
            if (aiData.lot) updates.lot = String(aiData.lot);
            if (aiData.expiry_date) updates.expiry_date = aiData.expiry_date;

            setFormData(prev => ({ ...prev, ...updates }));

            alert(`Analisis Completado!\n\nSe detectaron ${Object.keys(updates).length} campos automaticamente.`);
            stopAI();
        } catch (error) {
            console.error("AI Error:", error);
            alert("Error al analizar: " + error.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await updateProduct(initialData.id, formData);
            } else {
                await addProduct(formData);
            }
            onClose();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('¿Está seguro de ELIMINAR este producto?\n\nEsta acción no se puede deshacer.')) {
            setLoading(true);
            try {
                await removeProduct(initialData.id);
                onClose();
            } catch (error) {
                alert('Error al eliminar: ' + error.message);
                setLoading(false);
            }
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-modal overflow-y-auto bg-slate-900/80 backdrop-blur-sm">
            <div className={`relative w-full ${isScanning || isAI ? 'max-w-xl' : 'max-w-2xl'} mx-auto my-14 glass-panel bg-slate-800 border border-slate-700 shadow-2xl transition-all`}>

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-emerald-400">
                        {isScanning ? 'Escanear Código' : isAI ? 'Análisis Inteligente' : (initialData ? 'Editar Producto' : 'Nuevo Medicamento')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* MODES */}
                {isScanning ? (
                    // Barcode Mode
                    <div className="p-6">
                        <div id="reader-product" className="overflow-hidden rounded-xl border-2 border-slate-600 bg-black"></div>
                        <button onClick={stopScanner} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-medium">
                            <CameraOff size={20} /> Cancelar Escáner
                        </button>
                    </div>
                ) : isAI ? (
                    // AI Mode
                    <div className="p-6 flex flex-col items-center">
                        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-lg mb-4">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>

                            {aiLoading && (
                                <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 backdrop-blur-sm z-20 p-4 text-center">
                                    <Sparkles size={48} className="text-emerald-400 animate-pulse mb-4" />
                                    <p className="text-white font-bold text-lg animate-pulse">Analizando con IA Google...</p>
                                    <p className="text-emerald-300 text-sm mt-2">Identificando medicamento, lote y más.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button onClick={stopAI} disabled={aiLoading} className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium">
                                Cancelar
                            </button>
                            <button onClick={captureAndAnalyze} disabled={aiLoading} className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/40 flex justify-center items-center gap-2">
                                <Sparkles size={20} /> Analizar Foto
                            </button>
                        </div>
                    </div>
                ) : (
                    // Form Mode
                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Start AI Button Block - Only show if ADDING (not editing) for now to keep simple */}
                        {!initialData && (
                            <div className="md:col-span-2 flex gap-3 mb-2 p-3 bg-gradient-to-r from-emerald-900/40 to-slate-800 border border-emerald-500/30 rounded-lg items-center">
                                <div className="bg-emerald-500/20 p-2 rounded-full">
                                    <Sparkles className="text-emerald-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-emerald-300 font-bold text-sm">Autocompletado Inteligente</h4>
                                    <p className="text-slate-400 text-xs">Use la IA de Google para leer TODA la caja.</p>
                                </div>
                                <button type="button" onClick={startAI} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow shadow-emerald-900/50">
                                    🔮 Escanear con IA
                                </button>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Código</label>
                            <div className="flex gap-2">
                                <input required name="code" value={formData.code} autoComplete="off" onChange={handleChange}
                                    placeholder="Escanear o escribir..."
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-mono" />
                                <button type="button" onClick={startScanner} className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center" title="Escanear Barras">
                                    <Camera size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Nombre Genérico (Medicamento)</label>
                            <input required name="name" value={formData.name} autoComplete="off" onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Nombre Comercial</label>
                            <input name="commercial_name" value={formData.commercial_name} autoComplete="off" onChange={handleChange}
                                placeholder="Ej. Dolex, Tylex"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Concentración</label>
                            <input name="concentration" value={formData.concentration} autoComplete="off" onChange={handleChange}
                                placeholder="Ej. 500mg"
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Presentación</label>
                            <input name="presentation" value={formData.presentation} autoComplete="off" onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Laboratorio</label>
                            <input name="lab" value={formData.lab} autoComplete="off" onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Registro Sanitario (INVIMA)</label>
                            <input name="sanitary_register" value={formData.sanitary_register} autoComplete="off" onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Lote</label>
                            <input required name="lot" value={formData.lot} autoComplete="off" onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Fecha Vencimiento</label>
                            <input required type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Stock Actual</label>
                            <input required type="number" name="stock" value={formData.stock} onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Stock Mínimo</label>
                            <input required type="number" name="min_stock" value={formData.min_stock} onChange={handleChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </div>

                        {/* Footer Actions */}
                        <div className="md:col-span-2 pt-4 flex justify-between gap-3 border-t border-slate-700/50 mt-4">
                            <div>
                                {initialData && (
                                    <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                                        <Trash2 size={18} /> Eliminar
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">
                                    Cancelar
                                </button>
                                <button disabled={loading} type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    <Save size={20} />
                                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Producto')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
