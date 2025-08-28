import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";

export default function LogbookPage() {
  const { userID } = useUserContext(); 
  const [expandedHike, setExpandedHike] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    location: "",
    difficulty: "",
    duration: "",
    description: ""
  });
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedHike, setSelectedHike] = useState(null);
  const [plannedDate, setPlannedDate] = useState("");
  const [friends, setFriends] = useState([]);

  const API_URL = "https://sdp-backend-production.up.railway.app/query";

  useEffect(() => {
    fetchHikes();
  }, []);

  const fetchHikes = async () => {
    setLoading(true);
    try {
      const query = { sql: "SELECT * FROM trail_table ORDER BY trailid ASC" };
      const res = await axios.post(API_URL, query, { headers: { "Content-Type": "application/json" } });
      setHikes(res.data.rows);
    } catch (err) {
      console.error("Error fetching hikes:", err);
    }
    setLoading(false);
  };

  const filteredHikes = hikes.filter(hike =>
    (hike.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
    (hike.location || "").toLowerCase().includes(filters.location.toLowerCase()) &&
    (hike.difficulty?.toString() || "").toLowerCase().includes(filters.difficulty.toLowerCase()) &&
    (hike.duration ? new Date(hike.duration).toLocaleDateString() : "").toLowerCase().includes(filters.duration.toLowerCase()) &&
    (hike.description || "").toLowerCase().includes(filters.description.toLowerCase())
  );

  const openPlanModal = (hike) => {
    setSelectedHike(hike);
    setShowPlanModal(true);
  };

  const closeModals = () => {
    setShowPlanModal(false);
    setShowInviteModal(false);
    setSelectedHike(null);
    setPlannedDate("");
    setFriends(friends.map(f => ({ ...f, invited: false })));
  };

  const isDateValid = (dateString) => {
    if (!dateString) return false;
    const selected = new Date(dateString);
    return selected > new Date();
  };

  const handlePlanHike = async () => {
    if (!selectedHike || !isDateValid(plannedDate)) {
      alert("Please select a valid future date for your hike.");
      return;
    }
    try {
      const plannerRes = await axios.post(API_URL, {
        sql: `INSERT INTO planner_table (trailid, date) VALUES (${selectedHike.trailid}, '${plannedDate}') RETURNING plannerid`
      }, { headers: { "Content-Type": "application/json" } });

      const newPlannerId = plannerRes.data.rows[0].plannerid;

      await axios.post(API_URL, {
        sql: `INSERT INTO hike (plannerid, userid, iscoming) VALUES (${newPlannerId}, ${userID}, true)`
      }, { headers: { "Content-Type": "application/json" } });

      alert(`Planned hike "${selectedHike.name}" on ${new Date(plannedDate).toLocaleString()}`);
    } catch (err) {
      console.error("Error planning hike:", err);
      alert("Failed to plan hike. Please try again.");
    }
    closeModals();
  };

  const toggleFriendInvite = (id) => {
    setFriends(friends.map(f => f.id === id ? { ...f, invited: !f.invited } : f));
  };

  const fetchFriends = async () => {
    try {
      const followRes = await axios.post(API_URL, { sql: `SELECT userid2 FROM follow_table WHERE userid1 = ${userID}` }, { headers: { "Content-Type": "application/json" } });
      const userIds = followRes.data.rows.map(r => r.userid2);
      if (userIds.length === 0) { setFriends([]); return; }

      const userRes = await axios.post(API_URL, { sql: `SELECT userid, authid FROM usertable WHERE userid IN (${userIds.join(",")})` }, { headers: { "Content-Type": "application/json" } });

      const friendsData = userRes.data.rows.map(user => ({
        id: user.userid,
        name: `User ${user.userid}`,
        invited: false
      }));

      setFriends(friendsData);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setFriends([]);
    }
  };

  const handleInvite = async () => {
    if (!isDateValid(plannedDate)) {
      alert("Please select a valid future date before inviting friends.");
      return;
    }
    setShowPlanModal(false);
    await fetchFriends();
    setShowInviteModal(true);
  };

  const confirmInvites = async () => {
    if (!selectedHike || !isDateValid(plannedDate)) {
      alert("Please select a valid future date for your hike.");
      return;
    }

    try {
      const plannerRes = await axios.post(API_URL, {
        sql: `INSERT INTO planner_table (trailid, date) VALUES (${selectedHike.trailid}, '${plannedDate}') RETURNING plannerid`
      }, { headers: { "Content-Type": "application/json" } });

      const newPlannerId = plannerRes.data.rows[0].plannerid;

      await axios.post(API_URL, {
        sql: `INSERT INTO hike (plannerid, userid, iscoming) VALUES (${newPlannerId}, ${userID}, true)`
      }, { headers: { "Content-Type": "application/json" } });

      const invitedFriends = friends.filter(f => f.invited);
      for (const f of invitedFriends) {
        await axios.post(API_URL, {
          sql: `INSERT INTO hike (plannerid, userid, iscoming) VALUES (${newPlannerId}, ${f.id}, false)`
        }, { headers: { "Content-Type": "application/json" } });
      }

      alert(`Planned hike "${selectedHike.name}" on ${new Date(plannedDate).toLocaleString()} with friends: ${invitedFriends.map(f => f.name).join(", ")}`);
    } catch (err) {
      console.error("Error planning hike with friends:", err);
      alert("Failed to plan hike. Please try again.");
    }
    closeModals();
  };

  const isPlannable = isDateValid(plannedDate);

  return (
    <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Logbook</h1>
      </header>

      <section className="flex gap-6 w-full max-w-6xl">
        <aside className="w-1/4 rounded-lg bg-white shadow-md p-4 flex flex-col gap-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
            <section className="space-y-3">
              {Object.keys(filters).map(key => (
                <section key={key} className="flex flex-col">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700 capitalize">{key}</label>
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
          <section className="h-48 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Image goes here</p>
          </section>
        </aside>

        <section className="flex-1 rounded-lg bg-white shadow-md p-4 h-[800px] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Trails</h2>
          {loading ? <p className="text-gray-500">Loading...</p> : (
            <section className="divide-y border rounded-md">
              {filteredHikes.length > 0 ? (
                filteredHikes.map(hike => (
                  <article key={hike.trailid} className="flex flex-col">
                    <button
                      onClick={() => setExpandedHike(expandedHike === hike.trailid ? null : hike.trailid)}
                      className={`p-3 text-left flex justify-between items-center transition-colors ${
                        expandedHike === hike.trailid ? "bg-green-100 text-green-800" : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <p className="font-medium">{hike.name || `Trail #${hike.trailid}`}</p>
                      <p aria-hidden="true" className="ml-2 text-gray-500">{expandedHike === hike.trailid ? "▲" : "▼"}</p>
                    </button>
                    {expandedHike === hike.trailid && (
                      <section className="p-3 bg-green-50 text-gray-700 text-sm flex flex-col h-full">
                        <section className="space-y-2 flex-1 overflow-y-auto">
                          <p><strong>Location:</strong> {hike.location || "Unknown"}</p>
                          <p><strong>Difficulty:</strong> {hike.difficulty?.toString() || "Unknown"}</p>
                          <p><strong>Duration:</strong> {hike.duration ? new Date(hike.duration).toLocaleDateString() : "Unknown"}</p>
                          <p><strong>Description:</strong> {hike.description || "No description"}</p>
                        </section>
                        <button
                          onClick={() => openPlanModal(hike)}
                          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors self-end"
                        >
                          Plan Hike
                        </button>
                      </section>
                    )}
                  </article>
                ))
              ) : <p className="p-3 text-gray-500">No hikes found</p>}
            </section>
          )}
        </section>
      </section>

      {showPlanModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white rounded-lg shadow-lg p-6 w-96 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Plan Hike: {selectedHike?.name}</h2>
            <input
              type="datetime-local"
              value={plannedDate}
              onChange={e => setPlannedDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <section className="flex justify-between">
              <button
                onClick={handleInvite}
                disabled={!isPlannable}
                className={`px-4 py-2 rounded transition-colors ${isPlannable ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Invite
              </button>
              <button
                onClick={handlePlanHike}
                disabled={!isPlannable}
                className={`px-4 py-2 rounded transition-colors ${isPlannable ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Plan Hike
              </button>
            </section>
            <button
              onClick={closeModals}
              className="mt-2 text-sm text-gray-500 hover:underline self-end"
            >
              Cancel
            </button>
          </section>
        </section>
      )}

      {showInviteModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white rounded-lg shadow-lg p-6 w-96 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Invite Friends</h2>
            <p className="text-gray-700">
              Planned Date: {plannedDate ? new Date(plannedDate).toLocaleString() : "No date selected"}
            </p>
            <ul className="flex-1 overflow-y-auto divide-y">
              {friends.map(friend => (
                <li key={friend.id} className="flex justify-between items-center py-2">
                  <p>{friend.name}</p>
                  <button
                    onClick={() => toggleFriendInvite(friend.id)}
                    className={`px-3 py-1 rounded ${friend.invited ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
                  >
                    {friend.invited ? "Invited" : "Invite"}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={confirmInvites}
              disabled={!isPlannable}
              className={`mt-4 px-4 py-2 rounded transition-colors ${isPlannable ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Plan Hike
            </button>
            <button
              onClick={closeModals}
              className="mt-2 text-sm text-gray-500 hover:underline self-end"
            >
              Cancel
            </button>
          </section>
        </section>
      )}

    </main>
  );
}
