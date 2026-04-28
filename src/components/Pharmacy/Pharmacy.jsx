import React, { useState } from "react";
import { useEffect } from "react";
import {
    Search,
    MoreVertical,
    RefreshCcw,
    Upload,
    Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import DeleteProduct from "./DeleteProduct";
const Pharmacy = () => {
    const navigate = useNavigate();
    const initialData = [
        {
            id: "#PR0025",
            name: "Acetaminophen",
            price: "$500",
            offer: "$50",
            purchase: "17 Jun 2025",
            expiry: "22 Jun 2025",
            stock: 280,
            desc: "Prevents heart attacks and strokes",
            unit: "20mg",
        },
        {
            id: "#PR0024",
            name: "Cymbalta",
            price: "$500",
            offer: "$50",
            purchase: "10 Jun 2025",
            expiry: "15 Jun 2025",
            stock: 468,
            desc: "Treats hypertension, angina, and heart failure",
            unit: "17mg",
        },
        {
            id: "#PR0023",
            name: "Dupixent",
            price: "$300",
            offer: "$30",
            purchase: "22 May 2025",
            expiry: "27 May 2025",
            stock: 261,
            desc: "Used for muscle spasms and spasticity",
            unit: "40mg",
        },
        {
            id: "#PR0022",
            name: "Entresto",
            price: "$200",
            offer: "$20",
            purchase: "15 May 2025",
            expiry: "20 May 2025",
            stock: 550,
            desc: "Treats depression and panic disorder",
            unit: "28mg",
        },
        {
            id: "#PR0021",
            name: "Rybelsus",
            price: "$100",
            offer: "$10",
            purchase: "30 Apr 2025",
            expiry: "5 May 2025",
            stock: 303,
            desc: "Treats angina by dilating blood vessels",
            unit: "30ml",
        },
        {
            id: "#PR0020",
            name: "Pantoprazole",
            price: "$600",
            offer: "$60",
            purchase: "25 Apr 2025",
            expiry: "30 Apr 2025",
            stock: 468,
            desc: "Used for acid reflux and ulcers",
            unit: "10mg",
        },
        {
            id: "#PR0019",
            name: "Prednisone",
            price: "$700",
            offer: "$70",
            purchase: "13 Mar 2025",
            expiry: "18 Mar 2025",
            stock: 100,
            desc: "Reduces inflammation and immune response",
            unit: "20ml",
        },
    ];

    const [products, setProducts] = useState(initialData);
    const [search, setSearch] = useState("");
    const [showSort, setShowSort] = useState(false);
    const [sortType, setSortType] = useState("Newest");
    const [openMenu, setOpenMenu] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openView, setOpenView] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const convertDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toISOString().split("T")[0];
    };

    useEffect(() => {
        const closeMenu = () => setOpenMenu(null);
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, []);

    useEffect(() => {
  localStorage.setItem("products", JSON.stringify(products));
}, [products]);


    // 🔍 SEARCH
    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase())
    );

    // 🔽 SORT
    const sorted = [...filtered].sort((a, b) => {
        const aDate = new Date(a.purchase);
        const bDate = new Date(b.purchase);
        return sortType === "Newest" ? bDate - aDate : aDate - bDate;
    });





    return (
        <div className="p-6">
            {/* TITLE */}
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Pharmacy</h2>
                <p className="text-sm text-gray-500">
                    Home <span className="mx-1">»</span> Pharmacy
                </p>
            </div>

            {/* TOP BAR */}
            <div className="flex items-center justify-between mb-4">
                {/* SEARCH */}
                <div className="flex items-center  rounded-md overflow-hidden w-72">
                    <input
                        type="text"
                        placeholder="Search Keyword"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 text-sm w-full outline-none"
                    />

                    <button className="bg-[#1C62A0] px-3 py-2 text-white">
                        <Search size={16} />
                    </button>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">

                    {/* Refresh */}

                    <div className="relative group">
                        <button
                            onClick={() => {
                                setProducts(initialData);
                                setSearch("");
                                setSortType("Newest");
                            }}
                            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
                        >
                            <RefreshCcw size={16} />
                        </button>

                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            Refresh
                        </span>
                    </div>

                    {/* import */}

                    <div className="relative group">
                        <button
                            onClick={() => document.getElementById("importFile").click()}
                            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
                        >
                            <Upload size={16} />
                        </button>

                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            Import
                        </span>
                    </div>
                    <input
                        type="file"
                        id="importFile"
                        hidden
                        accept="application/json"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = () => {
                                const data = JSON.parse(reader.result);
                                setProducts(data);
                            };
                            reader.readAsText(file);
                        }}
                    />



                    {/* export */}

                    <div className="relative group">
                        <button
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(products, null, 2)], {
                                    type: "application/json",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "products.json";
                                a.click();
                            }}
                            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
                        >
                            <Download size={16} />
                        </button>

                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            Export
                        </span>
                    </div>

                    <button
                        onClick={() => setOpenAdd(true)}
                        className="bg-[#1C62A0] text-white px-4 py-2 rounded-md text-sm"
                    >
                        + New Product
                    </button>
                </div>
            </div>

            {/* CARD */}
            <div className="bg-white  rounded-lg">
                {/* CARD HEADER */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="text-sm font-medium">
                        Total Products{" "}
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">
                            {products.length}
                        </span>
                    </div>

                    <div className="relative">
                        {/* BUTTON */}
                        <button
                            onClick={() => setShowSort(!showSort)}
                            className="border border-gray-200  px-3 py-1.5 rounded-md text-sm bg-white flex items-center gap-2"
                        >
                            Sort By : {sortType}
                        </button>

                        {/* DROPDOWN */}
                        {showSort && (
                            <div className="absolute right-0 mt-2 w-36 bg-white  rounded-md shadow-md z-10">

                                <button
                                    onClick={() => {
                                        setSortType("Newest");
                                        setShowSort(false);
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortType === "Newest" ? "bg-gray-100 font-medium" : ""
                                        }`}
                                >
                                    Newest
                                </button>

                                <button
                                    onClick={() => {
                                        setSortType("Oldest");
                                        setShowSort(false);
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortType === "Oldest" ? "bg-gray-100 font-medium" : ""
                                        }`}
                                >
                                    Oldest
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Product Name</th>
                            <th className="p-3 text-left">Price</th>
                            <th className="p-3 text-left">Offer Price</th>
                            <th className="p-3 text-left">Purchase Date</th>
                            <th className="p-3 text-left">Expiry Date</th>
                            <th className="p-3 text-left">Stock</th>
                            <th className="p-3 text-left">Description</th>
                            <th className="p-3 text-left">Unit (ml/mg)</th>
                            <th className="p-3 text-left"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {sorted.map((p, i) => (
                            <tr key={i} className=" hover:bg-gray-50">
                                <td className="p-3">{p.id}</td>
                                <td
  onClick={() => navigate(`/product/${p.id.replace("#", "")}`)}
  className="p-3 cursor-pointer hover:text-[#1C62A0] hover:text-[#1373cc]"
>
  {p.name}
</td>
                                <td className="p-3">{p.price}</td>
                                <td className="p-3">{p.offer}</td>
                                <td className="p-3">{p.purchase}</td>
                                <td className="p-3">{p.expiry}</td>
                                <td className="p-3">{p.stock}</td>
                                <td className="p-3">{p.desc}</td>
                                <td className="p-3">{p.unit}</td>

                                {/* ACTION BUTTON */}
                                <td className="p-3 text-right relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenu(openMenu === i ? null : i);
                                        }}
                                        className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {openMenu === i && (
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">

<button
  onClick={() => navigate(`/product/${p.id.replace("#", "")}`)}
  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
>
  View Details
</button>
                                            <button
                                                onClick={() => {
                                                    setSelectedProduct({
                                                        id: p.id,
                                                        name: p.name,
                                                        price: Number(p.price.replace("$", "")),
                                                        offerPrice: Number(p.offer.replace("$", "")),
                                                        purchaseDate: convertDate(p.purchase),
                                                        expiryDate: convertDate(p.expiry),
                                                        unit: p.unit.includes("ml") ? "ml" : "mg",
                                                        stock: p.stock,
                                                        description: p.desc,
                                                        status: true,
                                                    });

                                                    setOpenEdit(true);
                                                    setOpenMenu(null);
                                                }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                                            >
                                                Edit
                                            </button>

<button
  onClick={() => {
    setDeleteId(p.id);     // store product id
    setShowDelete(true);   // open modal
    setOpenMenu(null);
  }}
  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
>
  Delete
</button>
                                        </div>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddProduct
                isOpen={openAdd}
                onClose={() => setOpenAdd(false)}
                onAdd={(newProduct) =>
                    setProducts([newProduct, ...products])
                }
            />

<EditProduct
  isOpen={openEdit}
  onClose={() => setOpenEdit(false)}
  product={selectedProduct}
  onUpdate={(updatedProduct) => {
    const formatDateDisplay = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatted = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      price: `$${updatedProduct.price}`,
      offer: `$${updatedProduct.offerPrice}`,
      purchase: formatDateDisplay(updatedProduct.purchaseDate),
      expiry: formatDateDisplay(updatedProduct.expiryDate),
      stock: updatedProduct.stock,
      desc: updatedProduct.description,
      unit: `${updatedProduct.unit}`,
    };

    const updatedList = products.map((item) =>
      item.id === updatedProduct.id ? formatted : item
    );

    setProducts(updatedList);
  }}
/>

<DeleteProduct
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  productId={deleteId}
  onDelete={() => {
    const updated = products.filter(
      (p) => p.id !== deleteId
    );
    setProducts(updated);
  }}
/>
        </div>
    );
};



export default Pharmacy;