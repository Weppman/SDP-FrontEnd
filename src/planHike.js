import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";
// DurationPicker component
export function DurationPicker({ value, onChange }) {
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    onChange(`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`);
  }, [hours, minutes, seconds]);

  return (
    <div className="flex gap-2 items-center">
      <input type="number" min="0" max="99" value={hours} onChange={e => setHours(Number(e.target.value))} className="w-16 text-center"/>
      <span>:</span>
      <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-16 text-center"/>
      <span>:</span>
      <input type="number" min="0" max="59" value={seconds} onChange={e => setSeconds(Number(e.target.value))} className="w-16 text-center"/>
    </div>
  );
}

export default function PlanHike() {
  const { userID } = useUserContext();
  const [expandedHike, setExpandedHike] = useState(null);
  const [filters, setFilters] = useState({ name: "", location: "", difficulty: "", duration: "", description: "" });
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedHike, setSelectedHike] = useState(null);
  const [plannedDate, setPlannedDate] = useState("");
  const [friends, setFriends] = useState([]);
  
  const API_URL = "https://sdp-backend-production.up.railway.app";
  const apiKey = process.env.REACT_APP_API_KEY;

  // Axios instance with x-api-key header
  const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { "x-api-key": apiKey },
  });

  useEffect(() => { fetchHikes(); }, []);

  const fetchHikes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/trails");
      setHikes(res.data.trails);
    } catch (err) { console.error(err); }
    setLoading(false);
  };


  const openPlanModal = (hike) => { setSelectedHike(hike); setShowPlanModal(true); };
  const closeModals = () => {
    setShowPlanModal(false);
    setShowInviteModal(false);
    setSelectedHike(null);
    setPlannedDate("");
    setFriends(friends.map(f => ({ ...f, invited: false })));
  };

  const formatTimespan = (ts) => {
    if (!ts) return "Unknown";
    if (typeof ts === "object" && ts !== null) {
      const h = String(ts.hours || 0).padStart(2, "0");
      const m = String(ts.minutes || 0).padStart(2, "0");
      const s = String(Math.floor(ts.seconds || 0)).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    const match = ts.toString().match(/(\d+):(\d+):(\d+)/);
    return match ? `${match[1].padStart(2,"0")}:${match[2].padStart(2,"0")}:${match[3].padStart(2,"0")}` : ts;
  };

  const durationToSeconds = (d) => {
    if (!d) return 0;
    if (typeof d === "object") {
      return (d.hours || 0) * 3600 + (d.minutes || 0) * 60 + (d.seconds || 0);
    }
    const parts = d.split(":").map(Number);
    return parts[0]*3600 + parts[1]*60 + (parts[2] || 0);
  };

  const filteredHikes = hikes.filter(hike => {
    const hikeDuration = durationToSeconds(hike.duration);
    const filterDuration = filters.duration === "" ? null : durationToSeconds(filters.duration);

    const hikeDiff = Number(hike.difficulty);
    const filterDiff = filters.difficulty === "" ? null : Number(filters.difficulty);

    return (
      (hike.name || "").toLowerCase().includes(filters.name.toLowerCase()) &&
      (hike.location || "").toLowerCase().includes(filters.location.toLowerCase()) &&
      (filterDiff === null || hikeDiff === filterDiff) &&
      (filterDuration === null || hikeDuration <= filterDuration) &&
      (hike.description || "").toLowerCase().includes(filters.description.toLowerCase())
    );
  });


  const isDateValid = (datetime) => {
    if (!datetime) return false;
    const [datePart, timePartRaw] = datetime.split("T");
    if (!datePart || !timePartRaw) return false;
    const [hours, minutes] = timePartRaw.split(":").map(Number);
    const selected = new Date(datePart);
    selected.setHours(hours, minutes, 0, 0);
    return selected > new Date();
  };

  const formatTime = (datetime) => {
    if (!datetime) return { datePart: "", timePart: "" };
    const [datePart, timePartRaw] = datetime.split("T");
    if (!datePart || !timePartRaw) return { datePart: "", timePart: "" };
    const timePart = timePartRaw.length === 5 ? `${timePartRaw}:00` : timePartRaw;
    return { datePart, timePart };
  };

  const handlePlanHike = async () => {
    if (!selectedHike || !isDateValid(plannedDate)) {
      alert("Please select a valid future date for your hike.");
      return;
    }
    try {
      const invitedIds = friends.filter(f => f.invited).map(f => f.id);
      const res = await apiClient.post("/plan-hike", {
        trailId: selectedHike.trailid,
        plannedAt: plannedDate,
        userId: userID,
        invitedFriends: invitedIds
      });
      if (res.data.success) {
        const msg = invitedIds.length > 0
          ? `Planned hike "${selectedHike.name}" with friends: ${invitedIds.join(", ")}`
          : `Planned hike "${selectedHike.name}" successfully!`;
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to plan hike. Please try again.");
    }
    closeModals();
  };

  const toggleFriendInvite = (id) => {
    setFriends(friends.map(f => f.id === id ? { ...f, invited: !f.invited } : f));
  };

  const fetchFriends = async () => {
    try {
      const res = await apiClient.get(`/friends/${userID}`);
      setFriends(res.data.friends.map(f => ({ ...f, invited: false })));
    } catch (err) {
      console.error(err);
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

  const isPlannable = isDateValid(plannedDate);

  return (
    <main className="bg-gray-50 min-h-screen pt-20 p-6 flex flex-col items-center">
      {/* Header */}
      <header className="mb-6"><h1 className="text-3xl font-bold text-gray-800">Plan Hike</h1></header>

      {/* Filters + Trails */}
      <section className="flex gap-6 w-full max-w-6xl">
        {/* Filters Sidebar */}
        <aside className="w-1/4 rounded-lg bg-white shadow-md p-4 flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <section className="space-y-3">
            {Object.keys(filters).map(key => {
              if (key === "duration") {
                return (
                  <section key={key} className="flex flex-col">
                    <label htmlFor={key} className="text-sm font-medium text-gray-700">
                      {key === "duration" 
                        ? "Duration of trails ≤ set time" 
                        : key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <DurationPicker
                      value={filters.duration}
                      onChange={val => setFilters({ ...filters, duration: val })}
                    />
                  </section>
                );
              } else if (key === "difficulty") {
                return (
                  <section key={key} className="flex flex-col">
                    <label htmlFor={key} className="text-sm font-medium text-gray-700 capitalize">{key}</label>
                    <select
                      id={key}
                      value={filters[key]}
                      onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Any</option>
                      {Array.from({ length: 11 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </section>
                );
              } else {
                return (
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
                );
              }
            })}
          </section>
        </aside>

        {/* Trails List */}
        <section className="flex-1 rounded-lg bg-white shadow-md p-4 h-[800px] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Trails</h2>
          {loading ? <p className="text-gray-500">Loading...</p> : (
            <section className="divide-y border rounded-md">
              {filteredHikes.length > 0 ? filteredHikes.map(hike => (
                <article key={hike.trailid} className="flex flex-col">
                  <button onClick={() => setExpandedHike(expandedHike === hike.trailid ? null : hike.trailid)} className={`p-3 text-left flex justify-between items-center transition-colors ${expandedHike === hike.trailid ? "bg-green-100 text-green-800" : "hover:bg-gray-50 text-gray-800"}`}>
                    <p className="font-medium">{hike.name || `Trail #${hike.trailid}`}</p>
                    <p aria-hidden="true" className="ml-2 text-gray-500">{expandedHike === hike.trailid ? "▲" : "▼"}</p>
                  </button>
                  {expandedHike === hike.trailid && (
                    <section className="p-3 bg-green-50 text-gray-700 text-sm flex flex-col h-full">
                      <section className="space-y-2 flex-1 overflow-y-auto">
                        <p><strong>Location:</strong> {hike.location || "Unknown"}</p>
                        <p><strong>Difficulty:</strong> {hike.difficulty?.toString() || "Unknown"}</p>
                        <p><strong>Duration:</strong> {typeof hike.duration === "object" ? formatTimespan(hike.duration) : hike.duration || "Unknown"}</p>
                        <p><strong>Description:</strong> {hike.description || "No description"}</p>
                        {hike.coordinates && (
                          <section className="mt-2 w-full h-64">
                            <iframe
                              title={`Map of ${hike.name}`}
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps?q=${hike.coordinates[0]},${hike.coordinates[1]}&hl=en&z=16&output=embed`}
                              allowFullScreen
                            ></iframe>
                          </section>
                        )}
                      </section>
                      <button onClick={() => openPlanModal(hike)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors self-end">Plan Hike</button>
                    </section>
                  )}
                </article>
              )) : <p className="p-3 text-gray-500">No hikes found</p>}
            </section>
          )}
        </section>
      </section>

      {/* Plan Hike Modal */}
      {showPlanModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white rounded-lg shadow-lg p-6 w-96 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Plan Hike: {selectedHike?.name}</h2>
            <input type="datetime-local" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"/>
            <section className="flex justify-between">
              <button onClick={handleInvite} disabled={!isPlannable} className={`px-4 py-2 rounded transition-colors ${isPlannable ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Invite</button>
              <button onClick={handlePlanHike} disabled={!isPlannable} className={`px-4 py-2 rounded transition-colors ${isPlannable ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Plan Hike</button>
            </section>
            <button onClick={closeModals} className="mt-2 text-sm text-gray-500 hover:underline self-end">Cancel</button>
          </section>
        </section>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <section className="bg-white rounded-lg shadow-lg p-6 w-96 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Invite Friends</h2>
            {plannedDate && <p className="text-gray-700">Planned Date: {formatTime(plannedDate).datePart} {formatTime(plannedDate).timePart}</p>}
            <ul className="flex-1 overflow-y-auto divide-y">
              {friends.map(friend => (
                <li key={friend.id} className="flex justify-between items-center py-2">
                  <p>{friend.name}</p>
                  <button onClick={() => toggleFriendInvite(friend.id)} className={`px-3 py-1 rounded ${friend.invited ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}>{friend.invited ? "Invited" : "Invite"}</button>
                </li>
              ))}
            </ul>
            <button onClick={handlePlanHike} disabled={!isPlannable} className={`mt-4 px-4 py-2 rounded transition-colors ${isPlannable ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Plan Hike</button>
            <button onClick={closeModals} className="mt-2 text-sm text-gray-500 hover:underline self-end">Cancel</button>
          </section>
        </section>
      )}
    </main>
  );
}
