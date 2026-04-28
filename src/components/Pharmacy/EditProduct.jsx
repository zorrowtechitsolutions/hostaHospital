import { useState, useEffect } from "react";
import { X } from "lucide-react";

const EditProduct = ({ isOpen, onClose, product, onUpdate }) => {
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    offerPrice: "",
    purchaseDate: "",
    expiryDate: "",
   unitValue: "",
   unitType: "mg",
    stock: "",
    description: "",
    status: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setForm(product);
    }
  }, [product]);

  if (!isOpen) return null;

  // 🔥 Validation
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.price || form.price <= 0)
      newErrors.price = "Valid price required";
    if (!form.offerPrice || form.offerPrice <= 0)
      newErrors.offerPrice = "Valid offer price required";
    if (form.offerPrice > form.price)
      newErrors.offerPrice = "Offer must be less than price";
    if (!form.purchaseDate)
      newErrors.purchaseDate = "Purchase date required";
    if (!form.expiryDate)
      newErrors.expiryDate = "Expiry date required";
    if (form.stock < 0)
      newErrors.stock = "Stock cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onUpdate(form);
    onClose();
  };

return (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl animate-fadeIn">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 ">
        <h1 className="text-base font-semibold text-gray-800">
          Edit Product
        </h1>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4 text-sm">

        {/* ID */}
        <div>
          <label className="block mb-1 text-gray-600">ID</label>
          <input
            value={form.id}
            disabled
            className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-500"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block mb-1 text-gray-600">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        {/* Price + Offer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-gray-600">Price</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Offer Price</label>
            <input
              name="offerPrice"
              type="number"
              value={form.offerPrice}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-gray-600">Purchase</label>
            <input
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Expire</label>
            <input
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
            />
          </div>
        </div>

        {/* Unit + Stock */}
<div className="grid grid-cols-3 gap-3">

  {/* Unit Amount */}
  <input
    name="unitValue"
    type="number"
    placeholder="Amount"
    value={form.unitValue}
    onChange={handleChange}
    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
  />

  {/* Unit Type */}
  <select
    name="unitType"
    value={form.unitType}
    onChange={handleChange}
    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
  >
    <option value="mg">mg</option>
    <option value="ml">ml</option>
  </select>

  {/* Stock */}
  <input
    name="stock"
    type="number"
    placeholder="Stock"
    value={form.stock}
    onChange={handleChange}
    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
  />
</div>


        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C62A0]/20 focus:border-[#1C62A0]"
         />

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-6 py-4 ">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#1C62A0] text-white rounded-md text-sm"
        >
          Save Changes
        </button>
      </div>

    </div>
  </div>
);
};

export default EditProduct;