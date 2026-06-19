import { Button } from '@/components/ui/button';
import { Printer, FileText, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ExportOptionsProps {
  invoiceRef: React.RefObject<HTMLDivElement>;
  invoiceNumber: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ invoiceRef, invoiceNumber }) => {
  const handlePrint = () => {
    if (!invoiceRef.current) return;

    // Print only the invoice (same DOM used for PDF/JPEG), avoiding full app layout.
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const invoiceHtml = invoiceRef.current.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Invoice ${invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            html, body { margin: 0; padding: 0; background: #fff; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
            .no-print { display: none !important; }
            /* Force the invoice to exactly fill the printable A4 area and
               avoid extra blank pages caused by inline 210mm width / 297mm min-height. */
            #invoice-print-root {
              box-shadow: none !important;
              margin: 0 auto !important;
              width: 190mm !important;        /* A4 width 210mm - 2 * 10mm margin */
              max-width: 190mm !important;
              min-height: 0 !important;
              page-break-inside: auto;
            }
            #invoice-print-root img { max-width: 100%; height: auto; }
            #invoice-print-root table { width: 100% !important; table-layout: auto; }
            #invoice-print-root, #invoice-print-root * { overflow: visible !important; }
          </style>
        </head>
        <body>
          ${invoiceHtml}
          <script>
            window.onload = () => {
              window.focus();
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    
    toast.loading('Generating PDF...');
    
    try {
      // Hide no-print elements temporarily
      const noPrintElements = invoiceRef.current.querySelectorAll('.no-print');
      noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      // Restore no-print elements
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoiceNumber}.pdf`);
      
      toast.dismiss();
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  const handleExportJPEG = async () => {
    if (!invoiceRef.current) return;
    
    toast.loading('Generating JPEG...');
    
    try {
      // Hide no-print elements temporarily
      const noPrintElements = invoiceRef.current.querySelectorAll('.no-print');
      noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      // Restore no-print elements
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '');
      
      const link = document.createElement('a');
      link.download = `invoice-${invoiceNumber}.jpeg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      
      toast.dismiss();
      toast.success('JPEG exported successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export JPEG');
    }
  };

  return (
    <div className="flex gap-3">
      <Button onClick={handlePrint} variant="outline" className="flex-1">
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button onClick={handleExportPDF} variant="outline" className="flex-1">
        <FileText className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button onClick={handleExportJPEG} variant="outline" className="flex-1">
        <Image className="w-4 h-4 mr-2" />
        JPEG
      </Button>
    </div>
  );
};

export default ExportOptions;
