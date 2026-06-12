import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import InvoiceHistory from '@/components/invoice/InvoiceHistory';
import { useInvoices, SavedInvoice } from '@/hooks/useInvoices';

const InvoiceHistoryPage = () => {
  const { invoices, loading, deleteInvoice } = useInvoices();
  const navigate = useNavigate();

  const handleSelect = (invoice: SavedInvoice) => {
    navigate('/', { state: { invoiceId: invoice.id } });
  };

  const handleNew = () => {
    navigate('/');
  };

  return (
    <AppLayout title="Invoice History">
      <div className="max-w-4xl mx-auto">
        <InvoiceHistory
          invoices={invoices}
          loading={loading}
          onSelect={handleSelect}
          onDelete={deleteInvoice}
          onNew={handleNew}
        />
      </div>
    </AppLayout>
  );
};

export default InvoiceHistoryPage;