import React, { useState } from "react";
import { X } from "lucide-react";

const AddProduct = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    price: "",
    offer: "",
    purchase: "",
    expiry: "",
    unitValue: "",
    unitType: "",
    stock: "",
    desc: "",
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // clear error on typing
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // 🔥 VALIDATION
  const validate = () => {
    let err = {};

    if (!form.name.trim()) err.name = "Name is required";

    if (!form.price) err.price = "Price is required";
    else if (isNaN(form.price) || Number(form.price) <= 0)
      err.price = "Enter valid price";

    if (form.offer) {
      if (isNaN(form.offer) || Number(form.offer) < 0)
        err.offer = "Invalid offer price";
      else if (Number(form.offer) >= Number(form.price))
        err.offer = "Offer must be less than price";
    }

    if (!form.purchase) err.purchase = "Purchase date required";

    if (!form.expiry) err.expiry = "Expiry date required";
    else if (new Date(form.expiry) <= new Date(form.purchase))
      err.expiry = "Expiry must be after purchase";

    if (!form.unit) err.unit = "Select unit";

    if (!form.stock) err.stock = "Stock required";
    else if (isNaN(form.stock) || Number(form.stock) < 0)
      err.stock = "Invalid stock";

    if (!form.desc.trim()) err.desc = "Description required";

    return err;
  };

  const handleSubmit = () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newProduct = {
      id: "#PR" + Math.floor(1000 + Math.random() * 9000),
      ...form,
    };

    onAdd(newProduct);
    onClose();

    // reset
    setForm({
      name: "",
      price: "",
      offer: "",
      purchase: "",
      expiry: "",
      unit: "",
      stock: "",
      desc: "",
    });

    setErrors({});
  };

  return (
<div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl animate-fadeIn">

    {/* HEADER */}
    <div className="flex items-center justify-between px-4 py-3 ">
      <h2 className="text-sm font-semibold text-gray-800">
        Add New Product
      </h2>
      <button
        onClick={onClose}
        className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
      >
        <X size={12} />
      </button>
    </div>

    {/* BODY */}
    <div className="p-4 space-y-3">

      {/* ID */}
      <div>
        <label className="text-xs text-gray-500">ID</label>
        <div className="mt-1 bg-gray-100 text-gray-600 px-2 py-1.5 rounded text-xs">
          #PR00011
        </div>
      </div>

      {/* NAME */}
      <div>
        <label className="text-xs text-gray-700">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className={`w-full mt-1 border px-2 py-1.5 rounded text-xs ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
        />
        <p className="text-red-500 text-[10px]">{errors.name}</p>
      </div>

      {/* PRICE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs">Price</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            className={`w-full mt-1 border px-2 py-1.5 rounded text-xs ${
              errors.price ? "border-red-500" : "border-gray-300"
            }`}
          />
          <p className="text-red-500 text-[10px]">{errors.price}</p>
        </div>

        <div>
          <label className="text-xs">Offer Price</label>
          <input
            name="offer"
            value={form.offer}
            onChange={handleChange}
            className={`w-full mt-1 border px-2 py-1.5 rounded text-xs ${
              errors.offer ? "border-red-500" : "border-gray-300"
            }`}
          />
          <p className="text-red-500 text-[10px]">{errors.offer}</p>
        </div>
      </div>

      {/* DATES */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs">Purchase</label>
          <input
            type="date"
            name="purchase"
            value={form.purchase}
            onChange={handleChange}
            className={`w-full mt-1 border px-2 py-1.5 rounded text-xs ${
              errors.purchase ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        <div>
          <label className="text-xs">Expire</label>
          <input
            type="date"
            name="expiry"
            value={form.expiry}
            onChange={handleChange}
            className={`w-full mt-1 border px-2 py-1.5 rounded text-xs ${
              errors.expiry ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
      </div>

      {/* UNIT + STOCK */}
<div className="grid grid-cols-3 gap-2">
  {/* Unit Amount */}
  <input
    name="unitValue"
    placeholder="Amount"
    value={form.unitValue}
    onChange={handleChange}
    className="border px-2 py-1.5 rounded text-xs border-gray-300"
  />

  {/* Unit Type */}
  <select
    name="unitType"
    value={form.unitType}
    onChange={handleChange}
    className="border px-2 py-1.5 rounded text-xs border-gray-300"
  >
    <option value="">Unit</option>
    <option value="mg">mg</option>
    <option value="ml">ml</option>
  </select>

  {/* Stock */}
  <input
    name="stock"
    placeholder="Stock"
    value={form.stock}
    onChange={handleChange}
    className="border px-2 py-1.5 rounded text-xs border-gray-300"
  />
</div>
      {/* DESCRIPTION */}
      <textarea
        name="desc"
        value={form.desc}
        onChange={handleChange}
        rows={2}
        placeholder="Description"
        className={`w-full border px-2 py-1.5 rounded text-xs ${
          errors.desc ? "border-red-500" : "border-gray-300"
        }`}
      />
    </div>

    {/* FOOTER */}
    <div className="flex justify-end gap-2 px-4 py-3 ">
      <button
        onClick={onClose}
        className="px-3 py-1 text-xs border rounded"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        className="px-3 py-1 text-xs bg-[#1C62A0] text-white rounded"
      >
        Add Product
      </button>
    </div>
  </div>
</div>

);
};

export default AddProduct;