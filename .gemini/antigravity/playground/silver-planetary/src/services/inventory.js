
import { supabase } from '../lib/supabaseClient';

export const InventoryService = {
    async getProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createProduct(product) {
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProduct(id, updates) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteProduct(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getDashboardStats() {
        // We can fetch just the needed data or compute locally. 
        // For V1, fetching all products is fine (not huge data yet).
        return this.getProducts();
    },

    async registerMovement(movement) {
        const { error: moveError } = await supabase
            .from('movements')
            .insert([movement]);

        if (moveError) throw moveError;

        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', movement.product_id)
            .single();

        if (fetchError) throw fetchError;

        const newStock = movement.type === 'IN'
            ? product.stock + parseInt(movement.quantity)
            : product.stock - parseInt(movement.quantity);

        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', movement.product_id);

        if (updateError) throw updateError;

        return true;
    },

    async getMovements() {
        const { data, error } = await supabase
            .from('movements')
            .select(`
                *,
                products (
                    code,
                    name,
                    commercial_name,
                    concentration,
                    presentation
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },
    async registerStockEntry({ code, lot, expiry_date, quantity, person, reason, lab, sanitary_register }) {
        // 1. Check if exact lot exists
        const { data: existingLot } = await supabase
            .from('products')
            .select('id')
            .eq('code', code)
            .eq('lot', lot)
            .maybeSingle();

        let productId = existingLot?.id;

        // 2. If Lot doesn't exist, create it (Clone metadata from other lot of same code)
        if (!productId) {
            const { data: genericProduct } = await supabase
                .from('products')
                .select('*')
                .eq('code', code)
                .limit(1)
                .maybeSingle();

            if (!genericProduct) throw new Error('El código no existe. Registrelo como Nuevo Producto.');

            const newLotData = {
                code: genericProduct.code,
                name: genericProduct.name,
                commercial_name: genericProduct.commercial_name,
                concentration: genericProduct.concentration,
                presentation: genericProduct.presentation,
                lab: lab || genericProduct.lab, // Use provided Lab or fallback to generic
                sanitary_register: sanitary_register || genericProduct.sanitary_register, // Use provided Invima or fallback
                min_stock: genericProduct.min_stock,
                lot: lot,
                expiry_date: expiry_date,
                stock: 0 // Will be incremented by movement
            };

            const newProduct = await this.createProduct(newLotData);
            productId = newProduct.id;
        }

        // 3. Register Movement (IN)
        return this.registerMovement({
            product_id: productId,
            type: 'IN',
            quantity: parseInt(quantity),
            reason: `${person || 'Admin'} - ${reason || 'Compra/Entrada'}`
        });
    }
};
