import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateUtils';

export const ActaGenerator = {
    generateDispensationReport(transactionData) {
        try {
            const doc = new jsPDF();
            const { product, quantity, reason, person, date } = transactionData;

            // --- Header ---
            doc.setFillColor(15, 23, 42); // Slate 900
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('KontaFarm', 20, 20);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Comprobante de Salida de Medicamentos', 20, 30);

            doc.setFontSize(10);
            doc.text(`Fecha: ${formatDate(date)}`, 150, 20);
            doc.text(`Hora: ${new Date(date).toLocaleTimeString()}`, 150, 26);

            // --- Patient / Service Info ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Datos de la Dispensación:', 20, 55);

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 58, 190, 58);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Paciente / Responsable:`, 20, 68);
            doc.setFont('helvetica', 'bold');
            doc.text(person.toUpperCase(), 70, 68);

            doc.setFont('helvetica', 'normal');
            doc.text(`Servicio / Motivo:`, 20, 76);
            doc.setFont('helvetica', 'bold');
            doc.text(reason.toUpperCase(), 70, 76);

            // --- Product Table ---
            const tableData = [
                [
                    product.code,
                    product.name,
                    `${product.lot} (Vence: ${product.expiry_date})`,
                    `${quantity} Unid.`
                ]
            ];

            autoTable(doc, {
                startY: 90,
                head: [['Código', 'Medicamento', 'Lote / Vencimiento', 'Cantidad']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 60 },
                    3: { cellWidth: 30, halign: 'center' }
                }
            });

            // --- Footer with Signatures ---
            const pageHeight = doc.internal.pageSize.height;
            const footerY = pageHeight - 50;

            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);

            // Signature 1
            doc.line(30, footerY, 90, footerY); // Line
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('ENTREGADO POR', 60, footerY + 5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text('Farmacia KontaFarm', 60, footerY + 10, { align: 'center' });

            // Signature 2
            doc.line(120, footerY, 180, footerY); // Line
            doc.setFont('helvetica', 'bold');
            doc.text('RECIBIDO POR', 150, footerY + 5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text(person, 150, footerY + 10, { align: 'center' });

            // Disclaimer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Este documento valida la entrega de medicamentos y debe ser anexado a la historia clínica.', 105, pageHeight - 10, { align: 'center' });

            // Save
            doc.save(`KontaFarm_Salida_${product.code}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Error al generar PDF: " + error.message);
        }
    },

    generateBatchReport(movements, title = 'Reporte de Movimientos (Turno)') {
        try {
            const doc = new jsPDF();

            // --- Header ---
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('KontaFarm', 20, 20);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(title, 20, 32);

            doc.setFontSize(10);
            doc.text(`Fecha Reporte: ${new Date().toLocaleDateString()}`, 150, 20);

            // --- Content ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Total Movimientos: ${movements.length}`, 20, 50);

            const tableData = movements.map(m => [
                new Date(m.created_at).toLocaleDateString(),
                m.type === 'IN' ? 'ENTRADA' : 'SALIDA',
                m.products?.name || 'N/A',
                m.quantity,
                m.reason || 'N/A'
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Fecha', 'Tipo', 'Medicamento', 'Cant.', 'Responsable/Motivo']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42] },
                styles: { fontSize: 8 },
            });

            doc.save(`KontaFarm_Reporte_Turno_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("Batch PDF Error:", error);
            alert("Error al generar reporte masivo: " + error.message);
        }
    }
};
