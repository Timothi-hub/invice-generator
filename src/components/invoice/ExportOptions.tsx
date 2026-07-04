import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Image, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExportOptionsProps {
  invoiceRef: React.RefObject<HTMLDivElement>;
  invoiceNumber: string;
}

type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A5';

// Page dimensions in mm (width x height, portrait)
const PAPER_SIZES: Record<PaperSize, { w: number; h: number; jsPdfFormat: string }> = {
  A4:     { w: 210, h: 297, jsPdfFormat: 'a4' },
  Letter: { w: 216, h: 279, jsPdfFormat: 'letter' },
  Legal:  { w: 216, h: 356, jsPdfFormat: 'legal' },
  A5:     { w: 148, h: 210, jsPdfFormat: 'a5' },
};
const PAGE_MARGIN_MM = 10;
const EXPORT_WIDTH_PX = 794; // 210mm at 96dpi (A4 invoice design width)
const EXPORT_MIN_HEIGHT_PX = 1123; // 297mm at 96dpi

const ExportOptions: React.FC<ExportOptionsProps> = ({ invoiceRef, invoiceNumber }) => {
  const [fitOnePage, setFitOnePage] = useState(true);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');

  const waitForImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }),
    );
  };

  // Capture a fresh, fixed-width clone instead of the on-screen preview.
  // The preview is intentionally scaled to fit the screen; html2canvas renders
  // scaled ancestors poorly and produces overlapping text in PDF/JPEG exports.
  const captureInvoiceCanvas = async () => {
    const source = invoiceRef.current;
    if (!source) throw new Error('Invoice preview not found');

    await document.fonts?.ready;

    const host = document.createElement('div');
    const clone = source.cloneNode(true) as HTMLElement;

    Object.assign(host.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: `${EXPORT_WIDTH_PX}px`,
      background: '#ffffff',
      pointerEvents: 'none',
      zIndex: '-1',
    });

    Object.assign(clone.style, {
      transform: 'none',
      width: `${EXPORT_WIDTH_PX}px`,
      maxWidth: `${EXPORT_WIDTH_PX}px`,
      minHeight: `${EXPORT_MIN_HEIGHT_PX}px`,
      margin: '0',
      boxShadow: 'none',
    });

    clone.querySelectorAll<HTMLElement>('.no-print').forEach((el) => {
      el.style.display = 'none';
    });

    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      await waitForImages(clone);
      return await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: EXPORT_WIDTH_PX,
        height: clone.scrollHeight,
        windowWidth: Math.max(EXPORT_WIDTH_PX, document.documentElement.clientWidth),
        windowHeight: Math.max(clone.scrollHeight, document.documentElement.clientHeight),
      });
    } finally {
      host.remove();
    }
  };

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

    const paper = PAPER_SIZES[paperSize];
    const contentW = paper.w - PAGE_MARGIN_MM * 2;
    const contentH = paper.h - PAGE_MARGIN_MM * 2;

    const fitStyles = fitOnePage
      ? `
        html, body { height: auto; }
        #invoice-print-root {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: ${contentW}mm !important;
          max-width: ${contentW}mm !important;
          max-height: ${contentH}mm !important;
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
          width: ${contentW}mm !important;
          max-width: ${contentW}mm !important;
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
            @page { size: ${paper.w}mm ${paper.h}mm; margin: ${PAGE_MARGIN_MM}mm; }
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
                // Scale invoice down so it fits within a single ${paperSize} page.
                const mmToPx = 96 / 25.4;
                const maxW = ${contentW} * mmToPx;
                const maxH = ${contentH} * mmToPx;
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
      const canvas = await captureInvoiceCanvas();
      
      const imgData = canvas.toDataURL('image/png');
      const paper = PAPER_SIZES[paperSize];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paper.jsPdfFormat,
      });

      const pageW = paper.w;
      const pageH = paper.h;
      const margin = fitOnePage ? PAGE_MARGIN_MM : 0;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;
      const ratio = canvas.height / canvas.width;
      let imgWidth: number;
      let imgHeight: number;
      if (fitOnePage) {
        // Scale to fit both width and height within page (single-page guarantee).
        const fitByWidth = availW;
        const fitByHeight = availH / ratio;
        imgWidth = Math.min(fitByWidth, fitByHeight);
        imgHeight = imgWidth * ratio;
      } else {
        imgWidth = pageW;
        imgHeight = pageW * ratio;
      }
      const x = (pageW - imgWidth) / 2;
      const y = fitOnePage ? (pageH - imgHeight) / 2 : 0;
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
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
      const canvas = await captureInvoiceCanvas();
      
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2 text-sm">
          {fitOnePage ? <Minimize2 className="w-4 h-4 text-primary" /> : <Maximize2 className="w-4 h-4 text-primary" />}
          <Label htmlFor="fit-toggle" className="cursor-pointer">
            {fitOnePage ? `Fit to one ${paperSize} page` : 'Full size print'}
          </Label>
          <Switch id="fit-toggle" checked={fitOnePage} onCheckedChange={setFitOnePage} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor="paper-size" className="text-xs text-muted-foreground">Paper</Label>
          <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
            <SelectTrigger id="paper-size" className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (210×297mm)</SelectItem>
              <SelectItem value="Letter">Letter (8.5×11in)</SelectItem>
              <SelectItem value="Legal">Legal (8.5×14in)</SelectItem>
              <SelectItem value="A5">A5 (148×210mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
