import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { useUserContext } from "../context/userContext.js";

export default function SearchUsersUI() {
  const { userID } = useUserContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const API_URL = "https://sdp-backend-production.up.railway.app";

  // Fetch friends of current user
  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profile/${userID}/friends`, {
        credentials: "include",
      });
      const data = await res.json();
      setFriends(data.map((user) => Number(user.id)));
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  }, [userID, API_URL]);

  // Fetch suggested/random users
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/users/random?limit=9&currentUserId=${userID}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      setSuggestedUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching suggested users:", err);
    }
  }, [userID, API_URL]);

  const refreshSuggestedUsers = async () => {
    setRefreshing(true);
    await fetchSuggestedUsers(); // already includes userID
    setRefreshing(false);
  };
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/users/search?username=${encodeURIComponent(query)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      const filteredResults = (data.users || []).filter(
        (user) => user.id !== userID,
      );
      setResults(filteredResults);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId) => {
    const currentlyFollowing = friends.includes(Number(userId));
    try {
      if (currentlyFollowing) {
        // Unfollow
        await fetch(`${API_URL}/follow/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ followerId: userID }), // important if backend needs it
        });
        setFriends((prev) => prev.filter((id) => id !== Number(userId)));
      } else {
        // Follow
        await fetch(`${API_URL}/follow/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ followerId: userID }),
        });
        setFriends((prev) => [...prev, Number(userId)]);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };
  const renderAvatar = (user) =>
    user.imageUrl ? (
      <img
        src={user.imageUrl}
        alt={user.username}
        className="h-12 w-12 rounded-full object-cover shadow-sm"
      />
    ) : (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-500">
        {user.username[0]?.toUpperCase()}
      </div>
    );

  const isFollowing = (userId) => friends.includes(Number(userId));

  // Initial fetch
  useEffect(() => {
    if (userID) {
      fetchSuggestedUsers();
      fetchFriends();
    }
  }, [userID, fetchSuggestedUsers, fetchFriends]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 pb-12 pt-12 sm:pt-16">
      <section className="mx-auto mt-6 w-full max-w-6xl rounded-lg bg-white p-6 shadow-md">
        {/* Search Section */}
        <section className="mb-8">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Search Users
          </h1>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-green-500 sm:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter username..."
                className="w-full rounded-l-2xl py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="mt-2 flex items-center justify-center rounded-r-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-500 sm:mt-0"
            >
              <FiSearch className="mr-2 h-5 w-5" />
              Search
            </button>
          </div>
        </section>

        {/* Suggested Users */}
        {!query && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                Suggested Users
              </h2>
              <button
                onClick={refreshSuggestedUsers}
                disabled={refreshing}
                className={`text-gray-500 transition hover:text-gray-700 ${
                  refreshing ? "cursor-not-allowed opacity-50" : ""
                }`}
                title="Refresh"
              >
                <FiRefreshCw
                  className={`h-5 w-5 transition-transform duration-500 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {suggestedUsers.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex transform flex-col items-center rounded-xl bg-white p-4 shadow transition-transform hover:scale-105 hover:shadow-lg"
                  >
                    {renderAvatar(user)}
                    <span className="mb-2 mt-2 text-lg font-medium text-gray-900">
                      {user.username}
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/profile/${user.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleFollowToggle(user.id)}
                        className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                          isFollowing(user.id)
                            ? "bg-gray-400 text-white hover:bg-gray-500"
                            : "bg-green-600 text-white hover:bg-green-500"
                        }`}
                      >
                        {isFollowing(user.id) ? "Unfollow" : "Follow"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-gray-500">
                No suggested users available. Try refreshing.
              </p>
            )}
          </section>
        )}

        {/* Search Results */}
        {query && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800 sm:text-2xl">
              Results
            </h2>
            {loading ? (
              <p className="py-6 text-center text-gray-500">Searching...</p>
            ) : results.length > 0 ? (
              <ul className="space-y-4">
                {results.map((user) => (
                  <li
                    key={user.id}
                    className="flex transform flex-col rounded-xl bg-white p-5 shadow transition-transform duration-200 hover:scale-105 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-4 flex items-center space-x-4 sm:mb-0">
                      {renderAvatar(user)}
                      <span className="text-lg font-medium text-gray-900">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
                      <Link
                        to={`/profile/${user.id}`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleFollowToggle(user.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          isFollowing(user.id)
                            ? "bg-gray-400 text-white hover:bg-gray-500"
                            : "bg-green-600 text-white hover:bg-green-500"
                        }`}
                      >
                        {isFollowing(user.id) ? "Unfollow" : "Follow"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-gray-500">
                No users found. Try another username.
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
