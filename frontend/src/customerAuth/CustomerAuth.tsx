import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function Login({ setCustomer }: { setCustomer: (c: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('customer_token', data.token);
      setCustomer(data.customer);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Customer Login</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700">Login</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export function Register({ setCustomer }: { setCustomer: (c: any) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      localStorage.setItem('customer_token', data.token);
      setCustomer(data.customer);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700">Register</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export function Profile({ customer }: { customer: any }) {
  const navigate = useNavigate();
  
  if (!customer) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-6 py-2 rounded">Login</button>
      </div>
    );
  }

  return (
    <div className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8">My Account</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase">Name</h3>
            <p className="text-lg font-medium text-gray-900">{customer.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase">Email</h3>
            <p className="text-lg font-medium text-gray-900">{customer.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase">Member Since</h3>
            <p className="text-lg font-medium text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
