import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function WishlistPage({ customer }: { customer: any }) {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;
    
    fetch('/api/wishlist', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setWishlistItems(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (customer) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [customer]);

  if (!customer) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your wishlist</h2>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-6 py-2 rounded">Login</button>
      </div>
    );
  }

  const handleRemove = async (productId: string) => {
    const token = localStorage.getItem('customer_token');
    await fetch(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // Trigger global refresh to update heart icons as well
    window.dispatchEvent(new Event('wishlistUpdated'));
    fetchWishlist();
  };

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem('customer_token');
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    window.dispatchEvent(new Event('cartUpdated'));
    alert('Added to cart!');
  };

  return (
    <div className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">My Wishlist</h2>
      
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading wishlist...</div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link to="/" className="text-indigo-600 hover:underline font-medium">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistItems.map((item) => (
            <div key={item.wishlistId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-48 relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100 text-red-500"
                  title="Remove from wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{item.category}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <div className="text-xl font-bold text-gray-900 mb-4">${item.price.toFixed(2)}</div>
                <div className="mt-auto">
                  <div className={`text-sm font-semibold mb-4 ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                  <button 
                    onClick={() => handleAddToCart(item.id)}
                    disabled={item.stock === 0}
                    className={`w-full py-2 rounded font-bold text-sm transition-colors ${item.stock > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WishlistHeart({ productId, customer }: { productId: string, customer: any }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const navigate = useNavigate();

  const checkWishlist = () => {
    if (!customer) return;
    const token = localStorage.getItem('customer_token');
    fetch('/api/wishlist', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setIsInWishlist(data.some((item: any) => item.id === productId));
      })
      .catch(console.error);
  };

  useEffect(() => {
    checkWishlist();
    window.addEventListener('wishlistUpdated', checkWishlist);
    return () => window.removeEventListener('wishlistUpdated', checkWishlist);
  }, [customer, productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!customer) {
      alert('Please log in to add items to your wishlist');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('customer_token');
    if (isInWishlist) {
      await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ productId })
      });
    }
    
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  return (
    <button 
      onClick={toggleWishlist}
      className="absolute top-2 right-2 p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors z-10"
      title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-red-500 text-red-500' : 'fill-transparent text-gray-400'}`} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={isInWishlist ? 0 : 2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
