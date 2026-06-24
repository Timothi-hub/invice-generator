import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Image, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ExportOptionsProps {
  invoiceRef: React.RefObject<HTMLDivElement>;
  invoiceNumber: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ invoiceRef, invoiceNumber }) => {
  const [fitOnePage, setFitOnePage] = useState(true);

  const handlePrint = () => {
    if (!invoiceRef.current) return;

    // Print only the invoice (same DOM used for PDF/JPEG), avoiding full app layout.
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const invoiceHtml = invoiceRef.current.outerHTML;

    // Collect all stylesheets from the host document so Tailwind/utility
    // classes render inside the new print window.
    const styleTags = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((node) => {
        if (node.tagName === 'LINK') {
          const href = (node as HTMLLinkElement).href;
          return href ? `<link rel="stylesheet" href="${href}">` : '';
        }
        return `<style>${(node as HTMLStyleElement).innerHTML}</style>`;
      })
      .join('\n');

    const fitStyles = fitOnePage
      ? `
        html, body { height: auto; }
        #invoice-print-root {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: 190mm !important;
          max-width: 190mm !important;
          max-height: 277mm !important;  /* A4 height 297mm - 2 * 10mm margin */
          min-height: 0 !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          break-inside: avoid !important;
        }
        #invoice-print-root * { page-break-inside: avoid !important; break-inside: avoid !important; }
      `
      : `
        #invoice-print-root {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: 190mm !important;
          max-width: 190mm !important;
          min-height: 0 !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        #invoice-print-root table { page-break-inside: auto !important; break-inside: auto !important; }
        #invoice-print-root tr  { page-break-inside: avoid !important; break-inside: avoid !important; }
      `;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Invoice ${invoiceNumber}</title>
          ${styleTags}
          <style>
            @page { size: A4; margin: 10mm; }
            html, body { margin: 0; padding: 0; background: #fff; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
            .no-print { display: none !important; }
            ${fitStyles}
            #invoice-print-root img { max-width: 100%; height: auto; }
            #invoice-print-root table { width: 100% !important; table-layout: auto; }
            /* Neutralize any inline transform from ResponsiveInvoiceFrame parents */
            #invoice-print-root { transform: none !important; }
          </style>
        </head>
        <body>
          <div id="print-wrapper">${invoiceHtml}</div>
          <script>
            window.onload = () => {
              const fit = ${fitOnePage ? 'true' : 'false'};
              const root = document.getElementById('invoice-print-root');
              if (root) { root.style.transform = 'none'; root.style.width = ''; }
              if (fit && root) {
                // Scale invoice down so it fits within a single A4 page.
                const mmToPx = 96 / 25.4;
                const maxW = 190 * mmToPx;
                const maxH = 277 * mmToPx;
                const w = root.scrollWidth;
                const h = root.scrollHeight;
                const scale = Math.min(1, maxW / w, maxH / h);
                if (scale < 1) {
                  root.style.transformOrigin = 'top left';
                  root.style.transform = 'scale(' + scale + ')';
                  root.style.width = w + 'px';
                }
              }
              window.focus();
              // Wait for stylesheets & images to load before printing.
              const imgs = Array.from(document.images);
              Promise.all(
                imgs.map((img) =>
                  img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
                )
              ).then(() => {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 350);
              });
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2 text-sm">
          {fitOnePage ? <Minimize2 className="w-4 h-4 text-primary" /> : <Maximize2 className="w-4 h-4 text-primary" />}
          <Label htmlFor="fit-toggle" className="cursor-pointer">
            {fitOnePage ? 'Fit to one page' : 'Full size print'}
          </Label>
        </div>
        <Switch id="fit-toggle" checked={fitOnePage} onCheckedChange={setFitOnePage} />
      </div>
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <Button onClick={handlePrint} variant="outline" className="flex-1 min-w-[110px]">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleExportPDF} variant="outline" className="flex-1 min-w-[110px]">
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button onClick={handleExportJPEG} variant="outline" className="flex-1 min-w-[110px]">
          <Image className="w-4 h-4 mr-2" />
          JPEG
        </Button>
      </div>
    </div>
  );
};

export default ExportOptions;
