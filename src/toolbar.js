import { Link } from "react-router-dom";
import { HiHome } from "react-icons/hi";
import { FaFacebook, FaInstagram } from "react-icons/fa";

function Toolbar() {
  return (
    <div className="w-full bg-gray-800 px-2 py-4 text-white">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex space-x-3">
          <Link
            to="/"
            className="flex transform cursor-pointer items-center justify-center rounded bg-blue-600 px-3 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            <HiHome className="text-2xl" />
          </Link>
          <Link
            to="/about"
            className="transform cursor-pointer rounded bg-blue-600 px-4 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            About Us
          </Link>
          <Link
            to="/products"
            className="transform cursor-pointer rounded bg-blue-600 px-4 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            Products
          </Link>
          <Link
            to="/contact"
            className="transform cursor-pointer rounded bg-blue-600 px-4 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            Contact Us
          </Link>
        </div>

        <div className="flex space-x-2">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex transform cursor-pointer items-center justify-center rounded bg-blue-600 px-3 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            <FaFacebook className="text-2xl" />
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex transform cursor-pointer items-center justify-center rounded bg-blue-600 px-3 py-2 transition-transform duration-700 ease-in-out hover:rounded-2xl hover:bg-blue-700 focus:outline-none"
          >
            <FaInstagram className="text-2xl" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
