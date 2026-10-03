import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalSales: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="bg-blue-500" />
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-green-500" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-purple-500" />
        <StatCard title="Total Sales" value={`$${stats.totalSales.toFixed(2)}`} icon={DollarSign} color="bg-yellow-500" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
      <div className={`${color} p-4 rounded-lg text-white mr-4`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
