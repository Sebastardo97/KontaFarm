
export const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiration = new Date(expiryDate);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const getExpiryStatus = (daysRemaining) => {
    if (daysRemaining <= 0) return 'expired'; // Red (Vencido)
    if (daysRemaining <= 180) return 'critical'; // Red (< 6 Meses)
    if (daysRemaining <= 365) return 'warning'; // Yellow (6-12 Meses)
    return 'good'; // Green (> 1 Año)
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO');
};
