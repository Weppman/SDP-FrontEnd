import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";

export default function History() {
  const { userID } = useUserContext();
  const [expandedHike, setExpandedHike] = useState(null);
  const [completedHikes, setCompletedHikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    date: ""
  });

  const API_URL = "https://sdp-backend-production.up.railway.app/query";

  const fetchCompletedHikes = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const query = {
        sql: `
          SELECT ch.completedhikeid, ch.userid, ch.trailid, ch.date, 
                 t.name, t.location, t.difficulty, t.duration, t.description
          FROM completed_hike_table ch
          JOIN trail_table t ON ch.trailid = t.trailid
          WHERE ch.userid = ${id}
          ORDER BY ch.completedhikeid ASC
        `
      };
      const res = await axios.post(API_URL, query, {
        headers: { "Content-Type": "application/json" },
      });
      setCompletedHikes(res.data.rows);
    } catch (err) {
      console.error("Error fetching completed hikes:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompletedHikes(userID);
  }, [userID]);

  const filteredHikes = completedHikes.filter(hike =>
    (hike.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
    (hike.date ? new Date(hike.date).toLocaleDateString() : "").includes(filters.date)
  );

  if (!userID) {
    return (
      <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center">
        <p className="text-gray-500">Loading user information...</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">History</h1>
      </header>

      <section className="flex gap-6 w-full max-w-6xl">
        <aside className="w-1/4 rounded-lg bg-white shadow-md p-4 flex flex-col gap-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
            <section className="space-y-3">
              {Object.keys(filters).map(key => (
                <section key={key} className="flex flex-col">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700 capitalize">
                    {key}
                  </label>
                  <input
                    id={key}
                    type="text"
                    value={filters[key]}
                    onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </section>
              ))}
            </section>
          </section>
        </aside>

        <section className="flex-1 rounded-lg bg-white shadow-md p-4 h-[800px] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Completed Hikes</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <section className="divide-y border rounded-md">
              {filteredHikes.length > 0 ? (
                filteredHikes.map(hike => (
                  <article key={hike.completedhikeid} className="flex flex-col">
                    <button
                      onClick={() =>
                        setExpandedHike(expandedHike === hike.completedhikeid ? null : hike.completedhikeid)
                      }
                      className={`p-3 text-left flex justify-between items-center transition-colors ${
                        expandedHike === hike.completedhikeid
                          ? "bg-green-100 text-green-800"
                          : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <p className="font-medium">{hike.name || `Trail #${hike.trailid}`}</p>
                      <p aria-hidden="true" className="ml-2 text-gray-500">
                        {expandedHike === hike.completedhikeid ? "▲" : "▼"}
                      </p>
                    </button>

                    {expandedHike === hike.completedhikeid && (
                      <section className="p-3 bg-green-50 text-gray-700 text-sm flex justify-between max-h-[300px] overflow-y-auto">
                        <section className="space-y-2">
                          <p><strong>Trail Name:</strong> {hike.name}</p>
                          <p><strong>Location:</strong> {hike.location}</p>
                          <p><strong>Difficulty:</strong> {hike.difficulty}</p>
                          <p><strong>Duration:</strong> {hike.duration ? new Date(hike.duration).toLocaleDateString() : "Unknown"}</p>
                          <p><strong>Description:</strong> {hike.description}</p>
                          <p><strong>Date Completed:</strong> {hike.date ? new Date(hike.date).toLocaleDateString() : "Unknown"}</p>
                        </section>
                      </section>
                    )}
                  </article>
                ))
              ) : (
                <p className="p-3 text-gray-500">No completed hikes found</p>
              )}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
