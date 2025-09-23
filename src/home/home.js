import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/userContext";

export default function Home() {
  const { userID, status } = useUserContext();
  const [feed, setFeed] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  const API_URL = "https://sdp-backend-production.up.railway.app/query";
  const apiKey = process.env.REACT_APP_API_KEY;

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const query = {
        sql: "SELECT * FROM activity_feed_table ORDER BY dateposted DESC LIMIT 20",
      };
      const res = await axios.post(API_URL, query, {
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
      });
      setFeed(res.data.rows);
    } catch (err) {
      console.error("Error fetching feed:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || !userID) return;

    const insertQuery = {
      sql: `INSERT INTO activity_feed_table (title, content, dateposted, userid) VALUES ('${newPost.title}', '${newPost.content}', NOW(), '${userID}')`,
    };

    try {
      await axios.post(API_URL, insertQuery, {
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
      });
      setNewPost({ title: "", content: "" });
      fetchFeed(); // refresh feed
    } catch (err) {
      console.error("Error adding post:", err);
    }
  };

  return (
    <main className="p-6 pt-20">
      <section className="flex flex-col lg:flex-row gap-6">
        {/* Left: New Post Form */}
        <section className="w-full lg:w-1/3 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Activity</h2>
          {status === "user" ? (
            <form onSubmit={handleAddPost} className="space-y-4">
              <fieldset className="flex flex-col">
                <label htmlFor="title" className="text-gray-700 mb-1">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={newPost.title}
                  onChange={handleInputChange}
                  className="rounded-md border border-gray-300 p-2"
                  placeholder="e.g., Morning Hike"
                  required
                />
              </fieldset>

              <fieldset className="flex flex-col">
                <label htmlFor="content" className="text-gray-700 mb-1">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={newPost.content}
                  onChange={handleInputChange}
                  className="rounded-md border border-gray-300 p-2"
                  placeholder="What did you do?"
                  required
                />
              </fieldset>

              <button
                type="submit"
                className="rounded bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-500"
              >
                Post
              </button>
            </form>
          ) : (
            <p className="text-gray-600">Please sign in to add a post.</p>
          )}
        </section>

        {/* Right: Activity Feed */}
        <section className="w-full lg:w-2/3 rounded-lg bg-gray-50 p-6 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Activity Feed</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : feed.length ? (
            <ul className="space-y-4">
              {feed.map((item) => (
                <li
                  key={item.activityfeedid}
                  className="rounded-lg bg-white p-4 shadow-md"
                >
                  <header className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    <span className="text-sm text-gray-500">UID: {item.userid}</span>
                  </header>
                  <p className="text-gray-600">{item.content}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(item.dateposted).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No activity yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}