import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  };

  const fetchCategories = () => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    fetchProducts();
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = editingProduct.image;
    
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const uploadRes = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        imageUrl = uploadData.url;
      }
    }

    const url = editingProduct.id 
      ? `http://localhost:5000/api/products/${editingProduct.id}`
      : 'http://localhost:5000/api/products';
    const method = editingProduct.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}` 
      },
      body: JSON.stringify({...editingProduct, image: imageUrl})
    });
    setEditingProduct(null);
    setSelectedFile(null);
    setIsAdding(false);
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Products</h2>
        <button 
          onClick={() => { setEditingProduct({ name: '', description: '', price: 0, category: categories[0]?.name || '', image: '', stock: 0 }); setSelectedFile(null); setIsAdding(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
        >
          <Plus size={20} className="mr-2" /> Add Product
        </button>
      </div>

      {(isAdding || editingProduct?.id) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{isAdding ? 'Add Product' : 'Edit Product'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input required type="text" className="w-full border p-2 rounded" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border p-2 rounded" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                    {categories.length > 0 ? categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.parentId ? `└ ${cat.name}` : cat.name}
                      </option>
                    )) : (
                      <option value="">No categories available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input required type="number" step="0.01" className="w-full border p-2 rounded" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input required type="number" className="w-full border p-2 rounded" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Image</label>
                <div className="flex items-center space-x-4">
                  {(selectedFile || editingProduct.image) && (
                    <img 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : editingProduct.image} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="w-full border p-2 rounded" 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required className="w-full border p-2 rounded h-24" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => {setEditingProduct(null); setIsAdding(false);}} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4 flex items-center">
                  <img src={product.image} className="w-10 h-10 rounded object-cover mr-3" alt="" />
                  <span className="font-medium text-gray-900">{product.name}</span>
                </td>
                <td className="p-4 text-gray-600">{product.category}</td>
                <td className="p-4 font-medium">${product.price.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => { setEditingProduct(product); setSelectedFile(null); }} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
