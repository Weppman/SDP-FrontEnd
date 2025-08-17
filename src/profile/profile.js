import React, { useState } from "react";
import { FaTwitter, FaFacebook, FaWhatsapp } from "react-icons/fa";

// Global goals hardcoded for now
const predefinedGoals = [
  { 
    id: "p1", 
    title: "First Hike Completed", 
    current: 1, 
    target: 1 
  },
  { 
    id: "p2", 
    title: "50 km Total Distance", 
    current: 0, 
    target: 50 
  },
  { 
    id: "p3", 
    title: "1000 m Elevation Gain", 
    current: 1000, target: 1000 
  },
  { 
    id: "p4", 
    title: "Five Hikes Completed", 
    current: 1, 
    target: 5 
  },
  { 
    id: "p5", 
    title: "200 km Total Distance", 
    current: 0, 
    target: 50 
  },
  { 
    id: "p6", 
    title: "5000 m Elevation Gain", 
    current: 5000, 
    target: 5000 
  },
];

// Sample hikes for pinning
const sampleHikes = [
  { 
    id: 1, 
    title: "Table Mountain", 
    distance: 12, 
    pinned: true 
  },
  { 
    id: 2, 
    title: "Lion's Head Sunrise", 
    distance: 8, 
    pinned: true 
  },
  { 
    id: 3, 
    title: "Drakensberg Hike", 
    distance: 15, 
    pinned: true 
  },
];

// Sample friends
const sampleFriends = [
  {
    id: 1,
    name: "Alice Smith",
    avatar: "https://i.pravatar.cc/50?img=1",
    status: "Loves mountain hikes",
    online: true,
  },
  {
    id: 2,
    name: "Bob Johnson",
    avatar: "https://i.pravatar.cc/50?img=2",
    status: "Exploring the outdoors",
    online: false,
  },
  {
    id: 3,
    name: "Charlie Lee",
    avatar: "https://i.pravatar.cc/50?img=3",
    status: "Trail runner",
    online: true,
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("global");
  const [userGoals, setUserGoals] = useState([
    { id: 1, title: "Test Completed Goal", current: 5, target: 5 },
    { id: 2, title: "Test Incomplete Goal", current: 1, target: 5 },
  ]);
  const [newGoal, setNewGoal] = useState({ title: "", target: "" });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState({ title: "", target: "" });
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [hikes, setHikes] = useState(sampleHikes);
  const [friends, setFriends] = useState(sampleFriends);

  // Toggle pin/unpin a hike
  const togglePin = (id) => {
    setHikes(hikes.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  // Add personal goal
  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target) return;
    const nextId = userGoals.length
      ? Math.max(...userGoals.map((g) => g.id)) + 1
      : 1;
    setUserGoals([
      ...userGoals,
      {
        id: nextId,
        title: newGoal.title,
        current: 0,
        target: Number(newGoal.target),
      },
    ]);
    setNewGoal({ title: "", target: "" });
  };

  const handleEditClick = (goal) => {
    setEditingGoalId(goal.id);
    setEditingGoal({ title: goal.title, target: goal.target });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = (id) => {
    setUserGoals(
      userGoals.map((g) =>
        g.id === id
          ? {
              ...g,
              title: editingGoal.title,
              target: Number(editingGoal.target),
            }
          : g,
      ),
    );
    setEditingGoalId(null);
  };

  const confirmDelete = (goal) => setGoalToDelete(goal);
  const handleDeleteConfirmed = () => {
    if (goalToDelete) {
      setUserGoals(userGoals.filter((g) => g.id !== goalToDelete.id));
      setGoalToDelete(null);
    }
  };
  const handleCancelDelete = () => setGoalToDelete(null);

  const handleShare = (goal, platform) => {
    const text = `I completed the goal "${goal.title}" (${goal.target} done)!`;
    let url = "";

    if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    } else if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    } else if (platform === "whatsapp") {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }

    window.open(
      url,
      "_blank",
      `width=${window.innerWidth},height=${window.innerHeight},top=0,left=0`,
    );
  };

  // Render functions
  const renderGoalItem = (goal, editable = false, showShare = false) => (
    <li
      key={goal.id}
      className="flex flex-col space-y-2 rounded-lg bg-white p-4 shadow-md"
    >
      <header className="flex items-center justify-between">
        {editingGoalId === goal.id && editable ? (
          <fieldset className="flex w-full flex-col">
            <input
              name="title"
              type="text"
              value={editingGoal.title}
              onChange={handleEditChange}
              className="mb-1 rounded-md border border-gray-300 p-2"
            />
            <input
              name="target"
              type="number"
              min="1"
              value={editingGoal.target}
              onChange={handleEditChange}
              className="rounded-md border border-gray-300 p-2"
            />
          </fieldset>
        ) : (
          <h3 className="flex items-center space-x-2 text-lg font-bold">
            <span>{goal.title}</span>
            {goal.source && (
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  goal.source === "global"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {goal.source === "global" ? "Global" : "Personal"}
              </span>
            )}
          </h3>
        )}

        <menu className="flex space-x-2">
          {editable && editingGoalId === goal.id && (
            <button
              onClick={() => handleSaveEdit(goal.id)}
              className="text-green-500 hover:underline"
            >
              Save
            </button>
          )}
          {editable && editingGoalId !== goal.id && (
            <button
              onClick={() => handleEditClick(goal)}
              className="text-blue-500 hover:underline"
            >
              Edit
            </button>
          )}
          {editable && (
            <button
              onClick={() => confirmDelete(goal)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          )}

          {showShare && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `I completed the goal "${goal.title}" (${goal.target} done)!`,
                  );
                  alert("Copied to clipboard!");
                }}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Copy
              </button>
              <button
                onClick={() => handleShare(goal, "twitter")}
                className="text-blue-400 hover:text-blue-600"
              >
                <FaTwitter size={20} />
              </button>
              <button
                onClick={() => handleShare(goal, "facebook")}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaFacebook size={20} />
              </button>
              <button
                onClick={() => handleShare(goal, "whatsapp")}
                className="text-green-500 hover:text-green-700"
              >
                <FaWhatsapp size={20} />
              </button>
            </>
          )}
        </menu>
      </header>

      <section className="h-3 w-full rounded-full bg-gray-200">
        <section
          className="h-3 rounded-full bg-green-500 transition-all duration-500"
          style={{
            width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
          }}
        ></section>
      </section>
      <p className="text-sm text-gray-600">
        {goal.current} of {goal.target} completed
      </p>
    </li>
  );

  const renderFriendItem = (friend) => (
    <li
      key={friend.id}
      className="flex items-center justify-between rounded-lg bg-white p-4 shadow-md"
    >
      <section className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={friend.avatar}
            alt={friend.name}
            className="h-12 w-12 rounded-full"
          />
          {friend.online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
          )}
        </div>
        <section>
          <h3 className="font-semibold text-gray-800">{friend.name}</h3>
          <p className="text-sm text-gray-500">{friend.status}</p>
        </section>
      </section>
      <menu className="flex space-x-2">
        <button className="text-blue-500 hover:underline">Message</button>
        <button
          className="text-red-500 hover:underline"
          onClick={() => setFriends(friends.filter((f) => f.id !== friend.id))}
        >
          Remove
        </button>
      </menu>
    </li>
  );

  const completedGoals = [
    ...predefinedGoals
      .filter((g) => g.current >= g.target)
      .map((g) => ({ ...g, source: "global" })),
    ...userGoals
      .filter((g) => g.current >= g.target)
      .map((g) => ({ ...g, source: "personal" })),
  ];

  return (
    <main className="p-6 pt-20">
      <section className="w-full rounded-lg bg-gray-50 p-6 shadow-md">
        {/* Profile Header */}
        <section className="mb-6 flex items-center space-x-4">
          <img
            src="https://i.pravatar.cc/100"
            alt="User Avatar"
            className="h-20 w-20 rounded-full shadow-md"
          />
          <section>
            <h1 className="text-2xl font-bold text-gray-800">Some Person</h1>
            <p className="text-gray-600">Avid hiker & goal achiever</p>
            <p className="mt-1 text-sm text-gray-500">
              {userGoals.filter((g) => g.current < g.target).length} personal
              goals • {hikes.length} hikes pinned • {friends.length} friends
            </p>
          </section>
        </section>

        {/* Pinned Hikes Section */}
        <section className="mb-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Pinned Hikes</h2>
          <ul className="space-y-2">
            {hikes
              .filter((h) => h.pinned)
              .map((hike) => (
                <li
                  key={hike.id}
                  className="flex items-center justify-between rounded-lg bg-green-200 p-4 shadow"
                >
                  <span>
                    {hike.title} ({hike.distance} km)
                  </span>
                  <button
                    onClick={() => togglePin(hike.id)}
                    className="text-yellow-600 hover:underline"
                  >
                    📌
                  </button>
                </li>
              ))}
          </ul>
        </section>

        {/* Tabs */}
        <nav className="flex space-x-4 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("global")}
            className={`pb-2 font-semibold ${activeTab === "global" ? "border-b-2 border-green-700 text-green-700" : "text-gray-500 hover:text-green-500"}`}
          >
            Global Goals
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`pb-2 font-semibold ${activeTab === "personal" ? "border-b-2 border-green-700 text-green-700" : "text-gray-500 hover:text-green-500"}`}
          >
            Your Goals
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-2 font-semibold ${activeTab === "completed" ? "border-b-2 border-green-700 text-green-700" : "text-gray-500 hover:text-green-500"}`}
          >
            Completed Goals
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`pb-2 font-semibold ${activeTab === "friends" ? "border-b-2 border-green-700 text-green-700" : "text-gray-500 hover:text-green-500"}`}
          >
            Friends
          </button>
        </nav>

        {/* Tab Content */}
        {activeTab === "global" && (
          <section className="mt-4 space-y-4">
            <ul className="space-y-3">
              {predefinedGoals
                .filter((g) => g.current < g.target)
                .map((goal) => renderGoalItem(goal, false))}
            </ul>
          </section>
        )}

        {activeTab === "personal" && (
          <section className="mt-4 space-y-4">
            <section className="space-y-4 rounded-lg bg-white p-4 shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800">
                Create New Goal
              </h2>
              <form onSubmit={handleAddGoal} className="space-y-2">
                <fieldset className="flex flex-col">
                  <label htmlFor="title" className="text-gray-700">
                    Goal Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={newGoal.title}
                    onChange={handleInputChange}
                    className="rounded-md border border-gray-300 p-2"
                    placeholder="e.g., 50 km This Month"
                    required
                  />
                </fieldset>
                <fieldset className="flex flex-col">
                  <label htmlFor="target" className="text-gray-700">
                    Target
                  </label>
                  <input
                    id="target"
                    name="target"
                    type="number"
                    min="1"
                    value={newGoal.target}
                    onChange={handleInputChange}
                    className="rounded-md border border-gray-300 p-2"
                    placeholder="e.g., 100"
                    required
                  />
                </fieldset>
                <button
                  type="submit"
                  className="rounded bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-500"
                >
                  Add Goal
                </button>
              </form>
            </section>

            {userGoals.filter((g) => g.current < g.target).length ? (
              <ul className="mt-4 space-y-3">
                {userGoals
                  .filter((g) => g.current < g.target)
                  .map((goal) => renderGoalItem(goal, true))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-600">
                You have not added any personal goals yet.
              </p>
            )}
          </section>
        )}

        {activeTab === "completed" && (
          <section className="mt-4 space-y-4">
            {completedGoals.length ? (
              <ul className="space-y-3">
                {completedGoals.map((goal) =>
                  renderGoalItem(goal, false, true),
                )}
              </ul>
            ) : (
              <p className="text-gray-600">No goals completed yet.</p>
            )}
          </section>
        )}

        {activeTab === "friends" && (
          <section className="mt-4 space-y-4">
            {friends.length ? (
              <ul className="space-y-3">
                {friends.map((friend) => renderFriendItem(friend))}
              </ul>
            ) : (
              <p className="text-gray-600">You have no friends added yet.</p>
            )}
          </section>
        )}

        {/* Delete Confirmation Modal */}
        {goalToDelete && (
          <section className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <section className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 text-center">
              <p className="text-lg text-gray-800">
                Are you sure you want to delete "{goalToDelete.title}"?
              </p>
              <menu className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteConfirmed}
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </menu>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
