export interface InvoiceItem {
  id: string;
  quantity: number;
  description: string;
  price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  deliveryCharges: number;
  designingCharges: number;
  expenses: number;
  termsConditions: string;
}

export interface CompanyProfile {
  companyName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  website: string;
  directorName: string;
}

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
};

export const calculateTotal = (
  items: InvoiceItem[],
  deliveryCharges: number,
  designingCharges: number
): number => {
  return calculateSubtotal(items) + deliveryCharges + designingCharges;
};

export const calculateProfit = (
  items: InvoiceItem[],
  deliveryCharges: number,
  designingCharges: number,
  expenses: number
): number => {
  return calculateTotal(items, deliveryCharges, designingCharges) - expenses;
};
