import { Link } from "react-router-dom";

export default function ViewProfileButton({ userID }) {
  return (
    <Link
      to={`/profile/${userID}`}
      className="rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
    >
      View Profile
    </Link>
  );
}
