import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';

export function CheckoutPage({ cartItems, customer, fetchCart }: { cartItems: any[], customer: any, fetchCart: () => void }) {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!customer) {
    return <div className="text-center py-20"><h2 className="text-2xl font-bold">Please log in to checkout</h2></div>;
  }

  if (cartItems.length === 0) {
    return <div className="text-center py-20"><h2 className="text-2xl font-bold">Your cart is empty</h2></div>;
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('customer_token');
      const res = await fetch('http://localhost:5000/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address, phone })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed');

      fetchCart(); // Clear cart in UI
      navigate(`/order-confirmation/${data.orderId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h2>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-6">Delivery Information</h3>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
            
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={customer.name} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={customer.email} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 h-24" placeholder="Enter your full delivery address"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="+1 (555) 000-0000" />
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Order Summary</h3>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate mr-4">{item.quantity}x {item.name}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateTotal()}</span>
              </div>
              <div className="flex justify-between mb-2 pb-4 border-b">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold">${calculateTotal()}</span>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
              <p className="font-medium mb-1">Payment Method: Simulated</p>
              <p>Hackathon mode enabled. No real payment processing will occur.</p>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              {loading ? 'Processing...' : 'Confirm Order & Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderConfirmationPage() {
  const { id } = useParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    fetch(`http://localhost:5000/api/orders/my-orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setOrderData(data);
      setLoading(false);
    })
    .catch(console.error);
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading order details...</div>;
  if (!orderData || !orderData.order) return <div className="text-center py-20">Order not found</div>;

  const { order, items } = orderData;

  return (
    <div className="flex-grow py-12 px-4 max-w-3xl mx-auto w-full">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-8">Thank you for your purchase. Your order has been placed successfully.</p>
        
        <div className="bg-gray-50 p-6 rounded-lg text-left mb-8">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Order Details (ID: #{order.id})</h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-orange-600">{order.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Delivery Address</p>
              <p className="font-medium">{order.address}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{order.phone}</p>
            </div>
          </div>
          
          <h4 className="font-bold mb-3">Items Ordered</h4>
          <div className="space-y-3 border-t pt-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-600">{item.quantity}x {item.name || 'Unknown Product'}</span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-indigo-600">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link to="/my-orders" className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">View All Orders</Link>
          <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    fetch('http://localhost:5000/api/orders/my-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setOrders(data);
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  if (loading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="flex-grow py-12 px-4 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">You have not placed any orders yet.</p>
          <Link to="/" className="text-indigo-600 hover:underline font-medium">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-lg font-bold">Order #{order.id}</h3>
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">{order.status}</span>
                </div>
                <p className="text-gray-500 text-sm">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="font-medium mt-2 text-indigo-600">${order.totalAmount.toFixed(2)}</p>
              </div>
              <Link to={`/order-confirmation/${order.id}`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
