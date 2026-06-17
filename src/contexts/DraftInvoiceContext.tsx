import { createContext, useContext, useState, ReactNode } from 'react';
import { InvoiceData } from '@/types/invoice';
import { InvoiceTemplate, invoiceTemplates } from '@/types/invoiceTemplates';

const getEmptyInvoice = (): InvoiceData => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  customerName: '',
  customerAddress: '',
  items: [],
  deliveryCharges: 0,
  designingCharges: 0,
  discount: 0,
  advance: 0,
  expenses: 0,
  termsConditions: 'Payment due within 30 days.',
});

interface DraftInvoiceContextValue {
  invoice: InvoiceData;
  setInvoice: (i: InvoiceData) => void;
  currentInvoiceId?: string;
  setCurrentInvoiceId: (id?: string) => void;
  selectedTemplate: InvoiceTemplate;
  setSelectedTemplate: (t: InvoiceTemplate) => void;
  resetInvoice: () => void;
}

const DraftInvoiceContext = createContext<DraftInvoiceContextValue | undefined>(undefined);

export const DraftInvoiceProvider = ({ children }: { children: ReactNode }) => {
  const [invoice, setInvoice] = useState<InvoiceData>(getEmptyInvoice());
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(invoiceTemplates[0]);

  const resetInvoice = () => {
    setInvoice(getEmptyInvoice());
    setCurrentInvoiceId(undefined);
  };

  return (
    <DraftInvoiceContext.Provider
      value={{ invoice, setInvoice, currentInvoiceId, setCurrentInvoiceId, selectedTemplate, setSelectedTemplate, resetInvoice }}
    >
      {children}
    </DraftInvoiceContext.Provider>
  );
};

export const useDraftInvoice = () => {
  const ctx = useContext(DraftInvoiceContext);
  if (!ctx) throw new Error('useDraftInvoice must be used within DraftInvoiceProvider');
  return ctx;
};