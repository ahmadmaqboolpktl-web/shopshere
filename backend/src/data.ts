export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt: string;
}

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    description: "The latest iPhone featuring a titanium design, A17 Pro chip, and a more advanced 48MP Main camera system.",
    price: 999.00,
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop",
    stock: 50,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "MacBook Pro 16-inch",
    description: "Supercharged by M3 Pro or M3 Max, MacBook Pro takes its power and efficiency further than ever.",
    price: 2499.00,
    category: "Laptops",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop",
    stock: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "iPad Air",
    description: "Lightweight, powerful, and featuring the M1 chip. Perfect for creativity on the go.",
    price: 599.00,
    category: "Tablets",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop",
    stock: 100,
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    name: "PlayStation 5",
    description: "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback.",
    price: 499.00,
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=600&auto=format&fit=crop",
    stock: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    name: "AirPods Pro 2",
    description: "Active Noise Cancellation reduces unwanted background noise. Adaptive Transparency lets outside sounds in while reducing loud environmental noise.",
    price: 249.00,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=600&auto=format&fit=crop",
    stock: 200,
    createdAt: new Date().toISOString()
  },
  {
    id: "6",
    name: "Classic Denim Jacket",
    description: "A timeless piece made from high-quality denim, perfect for layering during any season.",
    price: 89.99,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop",
    stock: 45,
    createdAt: new Date().toISOString()
  },
  {
    id: "7",
    name: "The Midnight Library",
    description: "A novel about all the choices that go into a life well lived, by Matt Haig.",
    price: 18.00,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop",
    stock: 120,
    createdAt: new Date().toISOString()
  },
  {
    id: "8",
    name: "Samsung Galaxy S24 Ultra",
    description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity.",
    price: 1299.00,
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=600&auto=format&fit=crop",
    stock: 30,
    createdAt: new Date().toISOString()
  }
];
