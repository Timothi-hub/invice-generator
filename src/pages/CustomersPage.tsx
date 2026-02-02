import { useState } from 'react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import CustomerList from '@/components/customers/CustomerList';
import CustomerForm from '@/components/customers/CustomerForm';
import AppLayout from '@/components/AppLayout';

const CustomersPage = () => {
  const { customers, loading, saveCustomer, deleteCustomer } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleClear = () => {
    setSelectedCustomer(null);
  };

  return (
    <AppLayout title="Customers">
      <div className="grid lg:grid-cols-2 gap-6">
        <CustomerForm
          customer={selectedCustomer}
          onSave={saveCustomer}
          onClear={handleClear}
        />
        <CustomerList
          customers={customers}
          loading={loading}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={deleteCustomer}
          selectedId={selectedCustomer?.id}
        />
      </div>
    </AppLayout>
  );
};

export default CustomersPage;
