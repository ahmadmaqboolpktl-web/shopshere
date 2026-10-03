import { useEffect, useState } from 'react';

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = () => {
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    })
      .then(res => res.json())
      .then(setOrders)
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <div className="p-8 relative">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Orders</h2>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">#{order.id}</td>
                <td className="p-4">
                  <div className="text-gray-900 font-medium">{order.customerName}</div>
                  <div className="text-gray-500 text-sm">{order.customerEmail}</div>
                </td>
                <td className="p-4 font-medium">${order.totalAmount.toFixed(2)}</td>
                <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => {
                      fetch(`/api/orders/${order.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }})
                        .then(res => res.json())
                        .then(setSelectedOrder)
                        .catch(console.error);
                    }}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Order #{selectedOrder.order.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Customer Name</p>
                <p className="font-medium">{selectedOrder.order.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer Email</p>
                <p className="font-medium">{selectedOrder.order.customerEmail}</p>
              </div>
              <div>
                <p className="text-gray-500">Delivery Address</p>
                <p className="font-medium">{selectedOrder.order.address}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone Number</p>
                <p className="font-medium">{selectedOrder.order.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Order Date</p>
                <p className="font-medium">{new Date(selectedOrder.order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Status</p>
                <span className="font-medium px-2 py-1 bg-gray-100 rounded text-xs">{selectedOrder.order.status}</span>
              </div>
            </div>

            <h4 className="font-bold border-b pb-2 mb-4">Items</h4>
            <div className="space-y-4 mb-6">
              {selectedOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="font-bold text-lg text-indigo-600">${selectedOrder.order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
