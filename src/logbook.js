import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";

export default function Logbook() {
  const { userID } = useUserContext();
  const [expandedHike, setExpandedHike] = useState(null);
  const [completedHikes, setCompletedHikes] = useState([]);
  const [upcomingHikes, setUpcomingHikes] = useState([]);
  const [pendingHikes, setPendingHikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", date: "" });
  const [upcomingFilters, setUpcomingFilters] = useState({ name: "", date: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTimespan, setEditTimespan] = useState("");
  const [selectedHikeId, setSelectedHikeId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startPlannedAt, setStartPlannedAt] = useState("");
  const [selectedUpcomingHikeId, setSelectedUpcomingHikeId] = useState(null);

  const API_URL = "https://sdp-backend-production.up.railway.app";

  const fetchUserData = async (uidArr) => {
    if (!uidArr || uidArr.length === 0) return {};
    try {
      const res = await axios.post(`${API_URL}/uid`, { uidArr });
      return res.data.userDatas || {};
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      return {};
    }
  };

  const fetchCompletedHikes = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/completed-hikes/${userId}`, { withCredentials: true });
      const rows = res.data.rows || [];
      const plannerIds = rows.map(h => h.userid);
      const userDatas = await fetchUserData(plannerIds);
      const formattedRows = rows.map(hike => ({
        ...hike,
        plannerName: userDatas[hike.userid]?.username || `User ${hike.userid}`
      }));
      setCompletedHikes(formattedRows);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const fetchUpcomingHikes = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/upcoming-hikes/${userId}`, { withCredentials: true });
      const rows = res.data.rows || [];
      const plannerIds = rows.map(h => h.plannerid);
      const userDatas = await fetchUserData(plannerIds);
      const formattedRows = rows.map(hike => ({
        ...hike,
        plannerName: userDatas[hike.plannerid]?.username || `User ${hike.plannerid}`
      }));
      setUpcomingHikes(formattedRows);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const fetchPendingHikes = useCallback(async () => {
    if (!userID) return;
    try {
      const res = await axios.get(`${API_URL}/pending-hikes/${userID}`);
      const hikes = res.data.pendingHikes || [];
      const plannerIds = hikes.map(h => h.plannerid);
      const userDatas = await fetchUserData(plannerIds);
      const hikesWithUsernames = hikes.map(hike => ({
        ...hike,
        inviterName: userDatas[hike.plannerid]?.username || `User ${hike.plannerid}`
      }));
      setPendingHikes(hikesWithUsernames);
    } catch (err) {
      console.error(err);
      setPendingHikes([]);
    }
  }, [userID]);

  useEffect(() => {
    if (userID) {
      fetchCompletedHikes(userID);
      fetchUpcomingHikes(userID);
      fetchPendingHikes();
    }
  }, [userID, fetchCompletedHikes, fetchUpcomingHikes, fetchPendingHikes]);

  const filteredCompletedHikes = completedHikes.filter(hike =>
    (hike.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
    (hike.date ? new Date(hike.date).toLocaleDateString() : "").includes(filters.date)
  );

  const filteredUpcomingHikes = upcomingHikes.filter(hike =>
    (hike.name || "").toLowerCase().includes(upcomingFilters.name.toLowerCase()) &&
    (hike.planned_at ? new Date(hike.planned_at).toLocaleDateString() : "").includes(upcomingFilters.date)
  );

  const formatTimespan = (timespan) => {
    if (!timespan) return "Unknown";
    if (typeof timespan === "object" && timespan !== null) {
      const h = String(timespan.hours || 0).padStart(2, "0");
      const m = String(timespan.minutes || 0).padStart(2, "0");
      const s = String(Math.floor(timespan.seconds || 0)).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    const tsString = timespan.toString();
    const match = tsString.match(/(\d+):(\d+):(\d+)/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}:${match[3].padStart(2, "0")}`;
    return tsString;
  };

  const openEditModal = (hike) => {
    setSelectedHikeId(hike.completedhikeid);
    setEditTimespan(formatTimespan(hike.timespan) || "");
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedHikeId(null);
    setEditTimespan("");
  };
  const handleUpdateTimespan = async () => {
    if (!selectedHikeId || !editTimespan) return;
    try {
      await axios.post(`${API_URL}/update-timespan`, 
        { completedHikeId: selectedHikeId, timespan: editTimespan },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      closeEditModal();
      fetchCompletedHikes(userID);
    } catch (err) {
      console.error(err);
    }
  };

  const openStartModal = (hike) => {
    setSelectedUpcomingHikeId(hike.plannerid);
    setStartPlannedAt(hike.planned_at ? new Date(hike.planned_at).toISOString().slice(11,16) : "");
    setShowStartModal(true);
  };
  const closeStartModal = () => {
    setShowStartModal(false);
    setSelectedUpcomingHikeId(null);
    setStartPlannedAt("");
  };
  const handleStartHike = async () => {
    if (!selectedUpcomingHikeId || !startPlannedAt) return;
    try {
      await axios.post(`${API_URL}/update-planned-time`, 
        { plannerId: selectedUpcomingHikeId, plannedTime: startPlannedAt },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      closeStartModal();
      fetchUpcomingHikes(userID);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptInvite = async (hikeId) => {
    try {
      await axios.post(`${API_URL}/hike-accept`, { hikeId });
      fetchPendingHikes();
      fetchUpcomingHikes(userID);
    } catch (err) { console.error(err); }
  };
  const handleDeclineInvite = async (hikeId) => {
    try {
      await axios.post(`${API_URL}/hike-decline`, { hikeId });
      fetchPendingHikes();
    } catch (err) { console.error(err); }
  };

  if (!userID) return <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center"><p className="text-gray-500">Loading user information...</p></main>;

  return (
    <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Logbook</h1>
      </header>
      <section className="flex gap-6 w-full max-w-6xl">
        <aside className="w-1/4 rounded-lg bg-white shadow-md p-4 flex flex-col gap-6">
          {/* Filters */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Hike Filters</h2>
            <section className="space-y-3">
              {Object.keys(upcomingFilters).map(key => (
                <section key={key} className="flex flex-col">
                  <label htmlFor={`up-${key}`} className="text-sm font-medium text-gray-700 capitalize">{key}</label>
                  <input id={`up-${key}`} type="text" value={upcomingFilters[key]} onChange={e => setUpcomingFilters({ ...upcomingFilters, [key]: e.target.value })} className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </section>
              ))}
            </section>
            <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Completed Hike Filters</h2>
            <section className="space-y-3">
              {Object.keys(filters).map(key => (
                <section key={key} className="flex flex-col">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700 capitalize">{key}</label>
                  <input id={key} type="text" value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })} className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </section>
              ))}
            </section>
          </section>
        </aside>

        <section className="flex-1 rounded-lg bg-white shadow-md p-4 h-[800px] flex flex-col">
          {/* Upcoming Hikes Header */}
          <h2 className="sticky top-0 bg-white z-10 text-xl font-semibold text-gray-800 mb-4 p-2">Upcoming Hikes</h2>

          {/* Pending Invites inside Upcoming section */}
          {pendingHikes.length > 0 && (
            <section className="bg-yellow-50 p-3 rounded mb-4">
              {pendingHikes.map(hike => (
                <article key={hike.hikeid} className="flex flex-col mb-2">
                  <button
                    onClick={() => setExpandedHike(expandedHike === hike.hikeid ? null : hike.hikeid)}
                    className={`p-3 text-left flex justify-between items-center transition-colors ${expandedHike === hike.hikeid ? "bg-yellow-100 text-yellow-800" : "hover:bg-yellow-200 text-gray-800"}`}
                  >
                    <p><strong>Invite from {hike.inviterName}:</strong> {hike.name || `Trail #${hike.trailid}`}</p>
                    <p aria-hidden="true">{expandedHike === hike.hikeid ? "▲" : "▼"}</p>
                  </button>
                  {expandedHike === hike.hikeid && (
                    <section className="p-3 bg-yellow-50 text-gray-700 text-sm flex flex-col max-h-[200px] overflow-y-auto relative">
                      <p><strong>Trail Name:</strong> {hike.name}</p>
                      <p><strong>Location:</strong> {hike.location}</p>
                      <p><strong>Difficulty:</strong> {hike.difficulty}</p>
                      <p><strong>Duration:</strong> {hike.duration || "Unknown"}</p>
                      <p><strong>Description:</strong> {hike.description}</p>
                      <p><strong>Planned At:</strong> {hike.planned_at ? new Date(hike.planned_at).toLocaleString() : "Unknown"}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleAcceptInvite(hike.hikeid)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Accept</button>
                        <button onClick={() => handleDeclineInvite(hike.hikeid)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Decline</button>
                      </div>
                    </section>
                  )}
                </article>
              ))}
            </section>
          )}

          {/* Upcoming Hikes List */}
          <section className="flex-1 overflow-y-auto">
            {loading ? <p className="text-gray-500">Loading...</p> :
              (filteredUpcomingHikes.length > 0 ? filteredUpcomingHikes.map(hike => (
                <article key={hike.plannerid} className="flex flex-col">
                  <button onClick={() => setExpandedHike(expandedHike === hike.plannerid ? null : hike.plannerid)} className={`p-3 text-left flex justify-between items-center transition-colors ${expandedHike === hike.plannerid ? "bg-green-100 text-green-800" : "hover:bg-gray-50 text-gray-800"}`}>
                    <p className="font-medium">{hike.name || `Trail #${hike.trailid}`}</p>
                    <p aria-hidden="true" className="ml-2 text-gray-500">{expandedHike === hike.plannerid ? "▲" : "▼"}</p>
                  </button>
                  {expandedHike === hike.plannerid && (
                    <section className="p-3 bg-green-50 text-gray-700 text-sm flex flex-col max-h-[200px] overflow-y-auto relative">
                      <p><strong>Trail Name:</strong> {hike.name}</p>
                      <p><strong>Location:</strong> {hike.location}</p>
                      <p><strong>Difficulty:</strong> {hike.difficulty}</p>
                      <p><strong>Duration:</strong> {hike.duration || "Unknown"}</p>
                      <p><strong>Description:</strong> {hike.description}</p>
                      <p><strong>Planned At:</strong> {hike.planned_at ? new Date(hike.planned_at).toLocaleString() : "Unknown"}</p>
                      <button onClick={() => openStartModal(hike)} className="mt-2 self-end px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors absolute bottom-2 right-2">Start</button>
                    </section>
                  )}
                </article>
              )) : <p className="p-3 text-gray-500">No upcoming hikes found</p>)}
          </section>

          {/* Completed Hikes */}
          <section className="flex-1 overflow-y-auto p-2 mt-4">
            <h2 className="sticky top-0 bg-white z-10 text-xl font-semibold text-gray-800 mb-4 p-2">Completed Hikes</h2>
            {loading ? <p className="text-gray-500">Loading...</p> :
              (filteredCompletedHikes.length > 0 ? filteredCompletedHikes.map(hike => (
                <article key={hike.completedhikeid} className="flex flex-col">
                  <button onClick={() => setExpandedHike(expandedHike === hike.completedhikeid ? null : hike.completedhikeid)} className={`p-3 text-left flex justify-between items-center transition-colors ${expandedHike === hike.completedhikeid ? "bg-green-100 text-green-800" : "hover:bg-gray-50 text-gray-800"}`}>
                    <p className="font-medium">{hike.name || `Trail #${hike.trailid}`}</p>
                    <p aria-hidden="true" className="ml-2 text-gray-500">{expandedHike === hike.completedhikeid ? "▲" : "▼"}</p>
                  </button>
                  {expandedHike === hike.completedhikeid && (
                    <section className="p-3 bg-green-50 text-gray-700 text-sm flex flex-col max-h-[200px] overflow-y-auto relative">
                      <p><strong>Trail Name:</strong> {hike.name}</p>
                      <p><strong>Location:</strong> {hike.location}</p>
                      <p><strong>Difficulty:</strong> {hike.difficulty}</p>
                      <p><strong>Duration:</strong> {hike.duration || "Unknown"}</p>
                      <p><strong>Description:</strong> {hike.description}</p>
                      <p><strong>Date Completed:</strong> {hike.date ? new Date(hike.date).toLocaleDateString() : "Unknown"}</p>
                      <p><strong>Time Span:</strong> {formatTimespan(hike.timespan)}</p>
                      <button onClick={() => openEditModal(hike)} className="mt-2 self-end px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Edit</button>
                    </section>
                  )}
                </article>
              )) : <p className="p-3 text-gray-500">No completed hikes found</p>)}
          </section>
        </section>
      </section>

      {/* --- Edit Modal --- */}
      {showEditModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Edit Timespan</h2>
            <input type="text" value={editTimespan} onChange={(e) => setEditTimespan(e.target.value)} className="border p-2 w-full mb-4" />
            <section className="flex justify-end gap-2">
              <button onClick={closeEditModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleUpdateTimespan} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
            </section>
          </section>
        </section>
      )}

      {/* --- Start Modal --- */}
      {showStartModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Set Start Time</h2>
            <input type="time" value={startPlannedAt} onChange={(e) => setStartPlannedAt(e.target.value)} className="border p-2 w-full mb-4" />
            <section className="flex justify-end gap-2">
              <button onClick={closeStartModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleStartHike} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
            </section>
          </section>
        </section>
      )}
    </main>
  );
}
