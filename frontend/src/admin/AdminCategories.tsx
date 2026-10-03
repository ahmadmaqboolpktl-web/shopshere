import { useEffect, useState } from 'react';

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const fetchCategories = () => {
    fetch('http://localhost:5000/api/admin/categories', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('admin_token');
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/categories${isEditing ? `/${currentId}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, parentId: parentId === '' ? null : parentId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error saving category');
      
      setName('');
      setParentId('');
      setIsEditing(false);
      setCurrentId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setError('');
    const token = localStorage.getItem('admin_token');
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting category');
      
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (category: any) => {
    setIsEditing(true);
    setCurrentId(category.id);
    setName(category.name);
    setParentId(category.parentId ? category.parentId.toString() : '');
    setError('');
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Categories</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Category Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Parent Category (Optional)</label>
                <select 
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">None (Top-level)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium w-full">
                  {isEditing ? 'Update' : 'Add'}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); setName(''); setParentId(''); setCurrentId(null); setError(''); }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-medium w-full"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading categories...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Parent</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-500">#{cat.id}</td>
                      <td className="p-4 font-medium text-gray-900">{cat.name}</td>
                      <td className="p-4 text-gray-500">
                        {cat.parentName ? (
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm">{cat.parentName}</span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Top-level</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="text-indigo-600 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && categories.length === 0 && (
              <div className="p-8 text-center text-gray-500">No categories found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
