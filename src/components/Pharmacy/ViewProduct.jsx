import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ViewProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

useEffect(() => {
  const saved = JSON.parse(localStorage.getItem("products")) || [];

  console.log("All products:", saved);
  console.log("URL ID:", id);

  const found = saved.find(
    (p) => p.id.replace("#", "") === id
  );

  console.log("FOUND:", found);

  setProduct(found);
}, [id]);


  if (!product) return <p className="p-6">Loading...</p>;

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">

    {/* MODAL */}
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">

      {/* CLOSE */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {product.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pharmacy <span className="mx-1">›</span> {product.name}
        </p>
      </div>

      {/* INNER CARD */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">

        <h2 className="text-sm font-semibold text-gray-700 mb-5">
          Basic Information
        </h2>

        <div className="grid grid-cols-2 gap-y-6 gap-x-10 text-sm">

          <div>
            <p className="text-gray-400 text-xs">Name</p>
            <p className="font-medium text-gray-900 mt-1">
              {product.name} {product.unit}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs">Expiry Date</p>
            <p className="font-medium text-gray-900 mt-1">
              {product.expiry}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs">Price</p>
            <p className="font-medium text-gray-900 mt-1">
              ₹{product.price}
              <span className="ml-2 text-green-600 text-xs font-medium">
                ({product.offer} Offer)
              </span>
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs">Stock</p>
            <p className="font-medium text-gray-900 mt-1">
              {product.stock}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs">Purchased Date</p>
            <p className="font-medium text-gray-900 mt-1">
              {product.purchase}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs">Status</p>
            <span className="inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
              In Stock
            </span>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* DESCRIPTION */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.desc}
          </p>
        </div>

      </div>
    </div>
  </div>
);

};

export default ViewProduct;