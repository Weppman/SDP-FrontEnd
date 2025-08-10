import React, { useState } from "react";

const ProductsPage = () => {
  const [selectedBlock, setSelectedBlock] = useState(null);

  const blocks = [
    {
      id: 1,
      title: "Electronics",
      img: "/assets/electronics.jpg",
      blurb: "Find top gadgets and devices.",
      brands: [
        { name: "Apple", img: "/assets/apple-logo.png" },
        { name: "Samsung", img: "/assets/samsung-logo.png" }
      ],
      description: "Explore cutting-edge electronics from leading brands."
    },
    {
      id: 2,
      title: "Clothing",
      img: "/assets/clothing.jpg",
      blurb: "Trendy and comfortable apparel.",
      brands: [
        { name: "Nike", img: "/assets/nike-logo.png" },
        { name: "Adidas", img: "/assets/adidas-logo.png" }
      ],
      description: "Stay stylish with the latest fashion collections."
    },
    {
      id: 3,
      title: "Home Appliances",
      img: "/assets/appliances.jpg",
      blurb: "Modern appliances for your home.",
      brands: [
        { name: "LG", img: "/assets/lg-logo.png" },
        { name: "Whirlpool", img: "/assets/whirlpool-logo.png" }
      ],
      description: "Upgrade your home with advanced appliances."
    },
    {
      id: 4,
      title: "Books",
      img: "/assets/books.jpg",
      blurb: "Knowledge and stories at your fingertips.",
      brands: [
        { name: "Penguin", img: "/assets/penguin-logo.png" },
        { name: "HarperCollins", img: "/assets/harper-logo.png" }
      ],
      description: "Discover books across all genres and authors."
    }
  ];

  return (
    <div className="p-6">
      {/* Top Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {blocks.map(block => (
          <div
            key={block.id}
            className="border rounded-lg shadow-lg p-4 text-center"
          >
            <img
              src={block.img}
              alt={block.title}
              className="w-full h-40 object-cover rounded"
            />
            <h2 className="text-xl font-bold mt-2">{block.title}</h2>
            <p className="text-gray-600">{block.blurb}</p>
            <button
              onClick={() => setSelectedBlock(block)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Learn More
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      {selectedBlock && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-2xl font-bold">{selectedBlock.title} Brands</h2>
          <p className="mt-2 text-gray-700">{selectedBlock.description}</p>

          {/* Brand Logos */}
          <div className="flex flex-wrap gap-4 mt-4">
            {selectedBlock.brands.map((brand, index) => (
              <div
                key={index}
                className="w-24 h-24 border rounded flex items-center justify-center p-2"
              >
                <img
                  src={brand.img}
                  alt={brand.name}
                  className="max-h-full max-w-full"
                />
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedBlock(null)}
            className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
