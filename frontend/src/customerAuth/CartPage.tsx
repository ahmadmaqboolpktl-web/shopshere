import { Link, useNavigate } from 'react-router-dom';

export function CartPage({ cartItems, fetchCart, customer }: { cartItems: any[], fetchCart: () => void, customer: any }) {
  const navigate = useNavigate();

  if (!customer) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your cart</h2>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-6 py-2 rounded">Login</button>
      </div>
    );
  }

  const handleUpdateQuantity = async (cartItemId: number, quantity: number) => {
    await fetch(`/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('customer_token')}`
      },
      body: JSON.stringify({ quantity })
    });
    fetchCart();
  };

  const handleRemove = async (cartItemId: number) => {
    await fetch(`/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('customer_token')}` }
    });
    fetchCart();
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Your Shopping Cart</h2>
      
      {cartItems.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="text-indigo-600 hover:underline font-medium">Continue Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-gray-500">{item.category}</p>
                    <p className="font-semibold mt-1">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button 
                        onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >-</button>
                      <span className="px-3 py-1 border-x border-gray-300">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                    <p className="font-bold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleRemove(item.cartItemId)} className="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateTotal()}</span>
              </div>
              <div className="flex justify-between mb-4 pb-4 border-b">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">${calculateTotal()}</span>
              </div>
              <Link to="/checkout" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors text-center inline-block">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
