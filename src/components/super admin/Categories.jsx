// src/components/super-admin/Categories.jsx (with images)
import React, { useState } from 'react';
import {
  Search,
} from 'lucide-react';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Categories with image paths (add your actual image paths)
  const categories = [
    { id: 1, name: 'Allopathy', image: '/images/categories/allopathy.png' },
    { id: 2, name: 'Homeopathy', image: '/images/categories/homeopathy.png' },
    { id: 3, name: 'Ayurveda', image: '/images/categories/ayurveda.png' },
    { id: 4, name: 'Unani', image: '/images/categories/unani.png' },
    { id: 5, name: 'Acupuncture', image: '/images/categories/acupuncture.png' },
    { id: 6, name: 'De-addiction', image: '/images/categories/deaddiction.png' },
    { id: 7, name: 'Mental Health', image: '/images/categories/mentalhealth.png' },
    { id: 8, name: 'Laboratory', image: '/images/categories/laboratory.png' },
    { id: 9, name: 'Eye Care', image: '/images/categories/eyecare.png' },
    { id: 10, name: 'Physiotherapy', image: '/images/categories/physiotherapy.png' },
    { id: 11, name: 'Dental Care', image: '/images/categories/dentalcare.png' },
    { id: 12, name: 'Others', image: '/images/categories/others.png' }
  ];

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage medical categories across the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Grid - Mobile style cards with images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
          >
            <div className="flex flex-col items-center">
              {/* Circular Image Area */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-green-200 mb-6">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl font-bold text-green-600">${category.name.charAt(0)}</div>`;
                  }}
                />
              </div>

              {/* Category Name */}
              <h3 className="text-xl font-semibold text-gray-800 text-center">
                {category.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;