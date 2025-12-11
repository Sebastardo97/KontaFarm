
import { createContext, useContext, useEffect, useState } from 'react';
import { InventoryService } from '../services/inventory';

const InventoryContext = createContext();

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) throw new Error('useInventory must be used within an InventoryProvider');
    return context;
};

export const InventoryProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshProducts = async () => {
        setLoading(true);
        try {
            const data = await InventoryService.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProducts();
    }, []);

    const addProduct = async (product) => {
        try {
            const newProduct = await InventoryService.createProduct(product);
            setProducts(prev => [newProduct, ...prev]);
            return newProduct;
        } catch (err) {
            throw err;
        }
    };

    const updateProduct = async (id, updates) => {
        try {
            const updated = await InventoryService.updateProduct(id, updates);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err) {
            throw err;
        }
    };

    const removeProduct = async (id) => {
        try {
            await InventoryService.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            throw err;
        }
    };

    const addStockEntry = async (entryData) => {
        try {
            await InventoryService.registerStockEntry(entryData);
            await refreshProducts(); // Refresh to show new stock
        } catch (err) {
            throw err;
        }
    };

    return (
        <InventoryContext.Provider value={{ products, loading, error, refreshProducts, addProduct, updateProduct, removeProduct, addStockEntry }}>
            {children}
        </InventoryContext.Provider>
    );
};
