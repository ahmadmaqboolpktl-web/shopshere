import { useEffect, useState } from 'react';

export function AdminUsers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/customers', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error loading users. Please try again.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Registered Customers</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-medium">Customer ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">#{customer.id}</td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{customer.name}</div>
                  </td>
                  <td className="p-4 text-gray-500">{customer.email}</td>
                  <td className="p-4 text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && customers.length === 0 && (
          <div className="p-8 text-center text-gray-500">No customers registered yet.</div>
        )}
      </div>
    </div>
  );
}
