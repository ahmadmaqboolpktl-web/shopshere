import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt: string;
}

interface Category {
  id: number | string;
  name: string;
  parentId: number | null;
}

function Home({ customer }: { customer?: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: 'All', parentId: null }]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => setCategories([{ id: 'all', name: 'All', parentId: null }, ...data]))
      .catch(console.error);

    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory !== 'All') {
      const selectedCatObj = categories.find(c => c.name === selectedCategory);
      if (selectedCatObj) {
        const subCatNames = categories.filter(c => c.parentId === selectedCatObj.id).map(c => c.name);
        result = result.filter(p => p.category === selectedCategory || subCatNames.includes(p.category));
      } else {
        result = result.filter(p => p.category === selectedCategory);
      }
    }

    // Filter by Search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price-low-high') return a.price - b.price;
      if (sortBy === 'price-high-low') return b.price - a.price;
      // newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, selectedCategory, search, sortBy, categories]);

  const topLevelCategories = categories.filter(c => c.parentId === null);
  const selectedCatObj = categories.find(c => c.name === selectedCategory);
  let subcategoriesToShow: Category[] = [];
  
  if (selectedCatObj && selectedCatObj.id !== 'all') {
    if (selectedCatObj.parentId === null) {
      // It is a parent, show its children
      subcategoriesToShow = categories.filter(c => c.parentId === selectedCatObj.id);
    } else {
      // It is a child, show its siblings
      subcategoriesToShow = categories.filter(c => c.parentId === selectedCatObj.parentId);
    }
  }

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <div className="bg-indigo-700 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Welcome to ShopSphere</h2>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-indigo-100">
          Discover the best deals on electronics, fashion, and more.
        </p>
        <div className="max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Search products by name..." 
            className="w-full px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute right-4 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
          {topLevelCategories.map((category, index) => {
            const isActive = selectedCategory === category.name || (selectedCatObj && selectedCatObj.parentId === category.id);
            return (
              <button 
                key={index} 
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
        {subcategoriesToShow.length > 0 && (
          <div className="flex overflow-x-auto space-x-3 pt-4 border-t border-gray-100 scrollbar-hide">
            {subcategoriesToShow.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedCategory(sub.name)}
                className={`flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-colors ${selectedCategory === sub.name ? 'bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white border-t border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            {selectedCategory === 'All' ? 'All Products' : `${selectedCategory}`}
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredAndSortedProducts.length} items)</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <label className="text-gray-600 font-medium text-sm">Sort by:</label>
            <select 
              className="border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-indigo-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading products...</div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <h4 className="text-xl text-gray-600">No products found matching your criteria.</h4>
            <button onClick={() => {setSearch(''); setSelectedCategory('All');}} className="mt-4 text-indigo-600 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col group relative">
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <WishlistHeart productId={product.id} customer={customer} />
                  {product.stock <= 20 && product.stock > 0 && (
                     <span className="absolute top-2 right-2 bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">Low Stock</span>
                  )}
                  {product.stock === 0 && (
                     <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Out of Stock</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="text-xs text-indigo-600 font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
                  <h4 className="font-bold text-gray-900 mb-1 truncate">{product.name}</h4>
                  
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                      <div className="font-bold text-lg text-gray-900">${product.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">{product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}</div>
                    </div>
                    <button className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductDetails({ customer }: { customer?: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching product:", err);
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="flex-grow flex items-center justify-center py-20 text-gray-500">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">Return to Home</button>
      </div>
    );
  }

  return (
    <main className="flex-grow bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center text-gray-600 hover:text-indigo-600 mb-8 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shop
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-1/2 h-96 md:h-auto bg-gray-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col relative">
            <div className="absolute top-8 right-8">
              <WishlistHeart productId={product.id} customer={customer} />
            </div>
            <div className="text-sm font-semibold text-indigo-600 tracking-wider uppercase mb-2">{product.category}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            <div className="text-3xl font-bold text-gray-900 mb-6">${product.price.toFixed(2)}</div>
            
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-auto border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>
              
              <button 
                onClick={async () => {
                  const token = localStorage.getItem('customer_token');
                  if (!token) {
                    alert('Please log in to add items to your cart.');
                    navigate('/login');
                    return;
                  }
                  await fetch('http://localhost:5000/api/cart', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ productId: product.id, quantity: 1 })
                  });
                  // We could dispatch an event here or trigger a fetchCart on App component
                  window.dispatchEvent(new Event('cartUpdated'));
                  alert('Added to cart!');
                }}
                disabled={product.stock === 0}
                className={`w-full py-4 rounded-lg font-bold text-lg flex justify-center items-center transition-colors ${product.stock > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { AdminOrders } from './admin/AdminOrders';
import { AdminUsers } from './admin/AdminUsers';
import { AdminCategories } from './admin/AdminCategories';

import { Login, Register, Profile } from './customerAuth/CustomerAuth';
import { CartPage } from './customerAuth/CartPage';
import { CheckoutPage, OrderConfirmationPage, MyOrdersPage } from './customerAuth/Orders';
import { WishlistPage, WishlistHeart } from './customerAuth/WishlistPage';

function App() {
  const [customer, setCustomer] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchCart = () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setCartItems([]);
      return;
    }
    fetch('http://localhost:5000/api/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(setCartItems)
    .catch(console.error);
  };

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCustomer(data);
          fetchCart();
        }
      })
      .catch(console.error);
    }
    
    const handleCartUpdate = () => fetchCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('customer_token');
    setCustomer(null);
    setCartItems([]);
    await fetch('http://localhost:5000/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center">
                  <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">ShopSphere</h1>
                </Link>
                <nav className="hidden md:flex space-x-8 items-center">
                  <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Home</Link>
                  <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Products</Link>
                  
                  {customer ? (
                    <>
                      <Link to="/wishlist" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Wishlist
                      </Link>
                      <Link to="/my-orders" className="text-gray-600 hover:text-indigo-600 font-medium">Orders</Link>
                      <Link to="/profile" className="text-gray-600 hover:text-indigo-600 font-medium">Profile</Link>
                      <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 font-medium">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link>
                      <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Register</Link>
                    </>
                  )}
                </nav>
                <div className="flex items-center space-x-4">
                  <Link to="/cart" className="text-gray-500 hover:text-indigo-600 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartTotalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {cartTotalItems}
                      </span>
                    )}
                  </Link>
                  <button 
                    className="md:hidden text-gray-500 hover:text-indigo-600 focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Mobile Navigation Menu */}
              {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-inner">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Home</Link>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Products</Link>
                  
                  {customer ? (
                    <>
                      <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Wishlist</Link>
                      <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Orders</Link>
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Profile</Link>
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <div className="pt-2">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 mb-2 rounded-lg text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100">Login</Link>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">Register</Link>
                    </div>
                  )}
                </div>
              )}
            </header>

            <Routes>
              <Route path="/" element={<Home customer={customer} />} />
              <Route path="/product/:id" element={<ProductDetails customer={customer} />} />
              <Route path="/login" element={<Login setCustomer={(c) => { setCustomer(c); fetchCart(); }} />} />
              <Route path="/register" element={<Register setCustomer={(c) => { setCustomer(c); fetchCart(); }} />} />
              <Route path="/profile" element={<Profile customer={customer} />} />
              <Route path="/wishlist" element={<WishlistPage customer={customer} />} />
              <Route path="/cart" element={<CartPage cartItems={cartItems} fetchCart={fetchCart} customer={customer} />} />
              <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} fetchCart={fetchCart} customer={customer} />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
            </Routes>

            <footer className="bg-gray-900 text-gray-300 py-8 text-center mt-auto">
              <p>&copy; {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
            </footer>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

