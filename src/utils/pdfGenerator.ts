import 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface PaymentData {
  id: string;
  date: string;
  client_name: string;
  program_name: string;
  amount: number;
  status: 'pending' | 'paid';
}

interface CoachInfo {
  full_name: string;
  email: string;
  phone?: string;
}

export function generateMonthlyIncomeReport(
  payments: PaymentData[],
  coachInfo: CoachInfo,
  month: string,
  year: string
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Rapport de revenus mensuels', 20, 30);
  
  // Coach info
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Coach: ${coachInfo.full_name}`, 20, 45);
  doc.text(`Email: ${coachInfo.email}`, 20, 55);
  if (coachInfo.phone) {
    doc.text(`Téléphone: ${coachInfo.phone}`, 20, 65);
  }
  
  // Period
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Période: ${month} ${year}`, 20, 80);
  
  // Summary
  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  doc.setFontSize(12);
  doc.text(`Total payé: ${totalPaid.toFixed(2)} CHF`, 20, 95);
  doc.text(`Total en attente: ${totalPending.toFixed(2)} CHF`, 20, 105);
  doc.text(`Nombre de transactions: ${payments.length}`, 20, 115);
  
  // Payments table
  const tableData = payments.map(payment => [
    new Date(payment.date).toLocaleDateString('fr-FR'),
    payment.client_name,
    payment.program_name,
    `${payment.amount.toFixed(2)} CHF`,
    payment.status === 'paid' ? 'Payé' : 'En attente'
  ]);
  
  autoTable(doc, {
    head: [['Date', 'Client', 'Séance', 'Montant', 'Statut']],
    body: tableData,
    startY: 130,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      3: { halign: 'right' }, // Amount column
      4: { halign: 'center' }, // Status column
    },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, pageHeight - 20);
  doc.text('Coachency - Plateforme de coaching professionnel', 20, pageHeight - 10);
  
  // Download the PDF
  const fileName = `revenus_${month.toLowerCase()}_${year}_${coachInfo.full_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}