import React, { useState } from "react";
import axios from "axios";
import {
  FaTwitter,
  FaFacebook,
  FaWhatsapp,
  FaTrophy,
  FaBullseye,
  FaCheckCircle,
  FaChartBar,
  FaUserFriends,
} from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import { useUserContext } from "../context/userContext";
import { useEffect } from "react";
import Stats from "./stats";

// Global goals hardcoded for now
// Sample hikes for pinning
const sampleHikes = [
  {
    id: 1,
    title: "Table Mountain",
    distance: 12,
    pinned: true,
  },
  {
    id: 2,
    title: "Lion's Head Sunrise",
    distance: 8,
    pinned: true,
  },
  {
    id: 3,
    title: "Drakensberg Hike",
    distance: 15,
    pinned: true,
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
  const { user } = useUser(); // get the logged-in user
  const { userID } = useUserContext();
  const API_URL = "https://sdp-backend-production.up.railway.app/query";
  const displayName = user?.username;
  const avatarUrl = user?.imageUrl;
  const [activeTab, setActiveTab] = useState("global");
  const [userGoals, setUserGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [newGoal, setNewGoal] = useState({ title: "", description: "" });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState({
    title: "",
    description: "",
  });
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [hikes, setHikes] = useState(sampleHikes);
  const [friends, setFriends] = useState(sampleFriends);
  const [globalGoals, setGlobalGoals] = useState([]);
  const [loadingGlobalGoals, setLoadingGlobalGoals] = useState(true);
  const [completedGlobalGoals, setCompletedGlobalGoals] = useState([]);
  const [loadingCompletedGlobal, setLoadingCompletedGlobal] = useState(true);
  const [completedPersonalGoals, setCompletedPersonalGoals] = useState([]);
  const [loadingCompletedPersonal, setLoadingCompletedPersonal] =
    useState(true);
  const [completedHikesData, setCompletedHikesData] = useState(null);
  const [loadingHikes, setLoadingHikes] = useState(true);

  useEffect(() => {
    if (!userID) return; // wait until Clerk provides userID

    const fetchGoals = async () => {
      try {
        const query = {
          sql: `SELECT gid AS id, name AS title, description , done 
              FROM goal_table 
              WHERE userid = '${userID}' AND done = false;`,
        };

        const res = await axios.post(API_URL, query, {
          headers: { "Content-Type": "application/json" },
        });

        // Map DB rows into shape your UI expects
        const goals = res.data.rows.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          target: 1, // always 1 for personal goals
          current: g.done ? 1 : 0,
          done: g.done,
          source: "personal",
        }));

        setUserGoals(goals);
      } catch (err) {
        console.error("Error fetching goals:", err);
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoals();
  }, [userID]);
  useEffect(() => {
    if (!userID) return; // wait until we have a user

    const fetchGlobalGoals = async () => {
      try {
        const query = {
          sql: `SELECT a.achievementid AS id,
                     a.name AS title,
                     a.description,
                     a.finishnumber AS target,
                     COALESCE(u.currentnumber, 0) AS current
              FROM achievements_table a
              LEFT JOIN achievementsuserid_table u
                     ON a.achievementid = u.achievementid
                     AND u.userid = '${userID}'
              WHERE COALESCE(u.currentnumber, 0) < a.finishnumber;`,
        };

        const res = await axios.post(API_URL, query, {
          headers: { "Content-Type": "application/json" },
        });

        const goals = res.data.rows.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          target: Number(g.target),
          current: Number(g.current),
          source: "global",
        }));

        setGlobalGoals(goals);
      } catch (err) {
        console.error("Error fetching achievements:", err);
      } finally {
        setLoadingGlobalGoals(false);
      }
    };

    fetchGlobalGoals();
  }, [userID]);
  useEffect(() => {
    if (!userID) return;

    const fetchCompletedHikes = async () => {
      try {
        const query = {
          sql: `SELECT * FROM completed_hike_table WHERE userid = '${userID}'`,
        };
        const trailsQuery = { sql: `SELECT * FROM trail_table` }; // adjust table name if different

        const [hikesRes, trailsRes] = await Promise.all([
          axios.post(API_URL, query, {
            headers: { "Content-Type": "application/json" },
          }),
          axios.post(API_URL, trailsQuery, {
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        setCompletedHikesData({
          completed_hike_table: hikesRes.data.rows,
          trail: trailsRes.data.rows,
        });
      } catch (err) {
        console.error("Error fetching completed hikes:", err);
      } finally {
        setLoadingHikes(false);
      }
    };

    fetchCompletedHikes();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchCompletedGlobal = async () => {
      try {
        const query = {
          sql: `
          SELECT a.achievementid AS id,
                 a.name AS title,
                 a.description,
                 a.finishnumber AS target,
                 u.currentnumber AS current
          FROM achievements_table a
          JOIN achievementsuserid_table u
            ON a.achievementid = u.achievementid
          WHERE u.userid = '${userID}' AND u.currentnumber >= a.finishnumber;
        `,
        };

        const res = await axios.post(API_URL, query, {
          headers: { "Content-Type": "application/json" },
        });

        const goals = res.data.rows.map((g) => ({
          id: g.id,
          title: g.title,
          target: Number(g.target),
          current: Number(g.current),
          source: "global",
        }));

        setCompletedGlobalGoals(goals);
      } catch (err) {
        console.error("Error fetching completed global goals:", err);
      } finally {
        setLoadingCompletedGlobal(false);
      }
    };

    fetchCompletedGlobal();
  }, [userID]);
  // Toggle pin/unpin a hike
  useEffect(() => {
    if (!userID) return;

    const fetchCompletedPersonal = async () => {
      try {
        const query = {
          sql: `SELECT gid AS id, name AS title, description, done 
              FROM goal_table 
              WHERE userid = '${userID}' AND done = true;`,
        };

        const res = await axios.post(API_URL, query, {
          headers: { "Content-Type": "application/json" },
        });

        const goals = res.data.rows.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          current: g.done ? 1 : 0, // for progress bar
          target: 1, // always 1 for personal goals
          done: g.done,
          source: "personal",
        }));

        setCompletedPersonalGoals(goals);
      } catch (err) {
        console.error("Error fetching completed personal goals:", err);
      } finally {
        setLoadingCompletedPersonal(false);
      }
    };

    fetchCompletedPersonal();
  }, [userID]);

  const togglePin = (id) => {
    setHikes(hikes.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  // Add personal goal
  const handleAddGoal = async (e) => {
    e.preventDefault();

    if (!newGoal.title || !newGoal.description) return;

    try {
      const insertQuery = {
        sql: `INSERT INTO goal_table (userid, name, description, done) 
            VALUES ('${userID}', '${newGoal.title}', '${newGoal.description}', false)
            RETURNING gid AS id, name AS title, description AS description, done;`,
      };

      const res = await axios.post(API_URL, insertQuery, {
        headers: { "Content-Type": "application/json" },
      });

      const savedGoal = res.data.rows[0];

      const formattedGoal = {
        id: savedGoal.id,
        title: savedGoal.title,
        description: savedGoal.description,
        current: 0,
        target: 1, // For progress bar
        done: savedGoal.done,
        source: "personal",
      };

      setUserGoals((prev) => [...prev, formattedGoal]);
      setNewGoal({ title: "", description: "" });
    } catch (err) {
      console.error("Error adding goal:", err);
    }
  };
  const handleEditClick = (goal) => {
    setEditingGoalId(goal.id);
    setEditingGoal({ title: goal.title, description: goal.description });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (id) => {
    if (!editingGoal.title.trim() || !editingGoal.description.trim()) {
      alert("Goal title and description cannot be empty.");
      return;
    }

    try {
      const updateQuery = {
        sql: `UPDATE goal_table 
            SET name = '${editingGoal.title}', description = '${editingGoal.description}'
            WHERE gid = '${id}' AND userid = '${userID}'
            RETURNING gid AS id, name AS title, description AS description, done;`,
      };

      const res = await axios.post(API_URL, updateQuery, {
        headers: { "Content-Type": "application/json" },
      });

      const updatedGoal = res.data.rows[0];

      setUserGoals(
        userGoals.map((g) =>
          g.id === id
            ? {
                ...g,
                title: updatedGoal.title,
                description: updatedGoal.description,
              }
            : g,
        ),
      );

      setEditingGoalId(null);
    } catch (err) {
      console.error("Error updating goal:", err);
    }
  };

  const confirmDelete = (goal) => setGoalToDelete(goal);
  const handleDeleteConfirmed = async () => {
    if (!goalToDelete) return;

    try {
      const deleteQuery = {
        sql: `DELETE FROM goal_table 
            WHERE gid = '${goalToDelete.id}' AND userid = '${userID}'
            RETURNING gid;`,
      };

      await axios.post(API_URL, deleteQuery, {
        headers: { "Content-Type": "application/json" },
      });

      // Update UI
      setUserGoals(userGoals.filter((g) => g.id !== goalToDelete.id));
      setGoalToDelete(null);
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  const handleCancelDelete = () => setGoalToDelete(null);

  const handleShare = (goal, platform) => {
    const text = `I completed the goal "${goal.title}" !`;
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
  const renderGoalItem = (
    goal,
    editable = false,
    showShare = false,
    showTag = true,
  ) => (
    <li
      key={goal.id}
      className="flex flex-col space-y-2 rounded-lg bg-white p-4 shadow-md"
    >
      <header className="flex items-center justify-between">
        {editingGoalId === goal.id && editable ? (
          <fieldset className="flex w-full flex-col space-y-2">
            <input
              name="title"
              type="text"
              value={editingGoal.title}
              onChange={handleEditChange}
              className="rounded-md border border-gray-300 p-2"
              placeholder="Goal Title"
            />
            <input
              name="description"
              type="text"
              value={editingGoal.description}
              onChange={handleEditChange}
              className="rounded-md border border-gray-300 p-2"
              placeholder="Goal Description"
            />
          </fieldset>
        ) : (
          <div className="flex flex-col">
            <h3 className="flex items-center space-x-2 text-lg font-bold">
              <span>{goal.title}</span>
              {showTag && goal.source && (
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    goal.source === "global"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {goal.source === "global" ? "Achievement" : "Goal"}
                </span>
              )}
            </h3>
            {goal.description && (
              <p className="text-sm text-gray-600">{goal.description}</p>
            )}
          </div>
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
                aria-label="whatsapp" // Add an aria-label if not already present
              >
                <FaWhatsapp size={20} />
              </button>
            </>
          )}
        </menu>
      </header>

      <section className="h-3 w-full rounded-full bg-gray-200">
        <section
          className={`h-3 rounded-full transition-all duration-500 ${
            goal.source === "personal"
              ? goal.done
                ? "bg-green-500"
                : "bg-red-400"
              : "bg-green-500"
          }`}
          style={{
            width: `${
              goal.source === "personal"
                ? goal.done
                  ? 100
                  : 0
                : Math.min((goal.current / goal.target) * 100, 100)
            }%`,
          }}
        ></section>
      </section>

      <p className="text-sm text-gray-600">
        {goal.source === "personal"
          ? goal.done
            ? "Completed"
            : "Incomplete"
          : `${goal.current} of ${goal.target} completed`}
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

  const completedGoals = [...completedGlobalGoals, ...completedPersonalGoals];

  return (
    <main className="p-6 pt-20">
      <section className="w-full rounded-lg bg-gray-50 p-6 shadow-md">
        {/* Profile Header */}
        <section className="mb-6 flex items-center space-x-4">
          <img
            src={avatarUrl} // fallback
            alt={displayName || "User Avatar"}
            className="h-20 w-20 rounded-full shadow-md"
          />
          <section>
            <h1 className="text-2xl font-bold text-gray-800">
              {displayName || "Some Person"}
            </h1>
            <p className="text-gray-600">Avid hiker & goal achiever</p>
            <p className="mt-1 text-sm text-gray-500">
              {userGoals.filter((g) => g.current < g.target).length} personal
              goals • {hikes.length} hikes pinned • {friends.length} following
            </p>
          </section>
        </section>

        {/* Pinned Hikes Section */}
        <section className="mb-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Pinned Hikes</h2>
          {loadingHikes ? (
            <p className="text-gray-600">Loading hikes...</p>
          ) : hikes.filter((h) => h.pinned).length ? (
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
          ) : (
            <p className="text-gray-600">No hikes pinned yet.</p>
          )}
        </section>

        {/* Tabs */}
        {/* Tabs */}
        <nav className="flex w-full border-b-2 border-gray-200">
          {[
            {
              name: "Achievements",
              key: "global",
              icon: <FaTrophy className="mr-2 inline" />,
            },
            {
              name: "Goals",
              key: "personal",
              icon: <FaBullseye className="mr-2 inline" />,
            },
            {
              name: "Completed",
              key: "completed",
              icon: <FaCheckCircle className="mr-2 inline" />,
            },
            {
              name: "Statistics",
              key: "stats",
              icon: <FaChartBar className="mr-2 inline" />,
            },
            {
              name: "Following",
              key: "friends",
              icon: <FaUserFriends className="mr-2 inline" />,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 pb-2 text-center font-semibold transition-colors ${
                  isActive
                    ? "border-b-2 border-green-700 text-green-700"
                    : "text-gray-500 hover:text-green-500"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        {activeTab === "global" && (
          <section className="mt-4 space-y-4">
            <ul className="space-y-3">
              {loadingGlobalGoals ? (
                <p className="text-gray-600">Loading achievements...</p>
              ) : globalGoals.length ? (
                <ul className="space-y-3">
                  {globalGoals
                    .filter((g) => g.current < g.target)
                    .map((goal) => renderGoalItem(goal, false, false, false))}
                </ul>
              ) : (
                <p className="text-gray-600">No achievements available.</p>
              )}
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
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={newGoal.title}
                    onChange={handleInputChange}
                    className="rounded-md border border-gray-300 p-2"
                    placeholder="e.g., Hike Table Mountain"
                    required
                  />
                </fieldset>

                <fieldset className="flex flex-col">
                  <label htmlFor="description" className="text-gray-700">
                    Description
                  </label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={newGoal.description}
                    onChange={handleInputChange}
                    className="rounded-md border border-gray-300 p-2"
                    placeholder="e.g., Hike 50 km this month"
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

            {loadingGoals ? (
              <p className="mt-4 text-gray-600">Loading your goals...</p>
            ) : userGoals.filter((g) => !g.done).length ? (
              <ul className="mt-4 space-y-3">
                {userGoals
                  .filter((g) => !g.done)
                  .map((goal) => renderGoalItem(goal, true, false, false))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-600">
                You have not added any personal goals yet.
              </p>
            )}
          </section>
        )}
        {activeTab === "stats" && (
          <Stats
            userGoals={userGoals}
            globalGoals={globalGoals}
            completedGoals={completedGoals}
            completedHikesData={completedHikesData}
          />
        )}

        {activeTab === "completed" && (
          <section className="mt-4 space-y-4">
            {loadingCompletedGlobal || loadingCompletedPersonal ? (
              <p className="text-gray-600">Loading completed achievements...</p>
            ) : completedGoals.length ? (
              <ul className="space-y-3">
                {completedGoals.map((goal) =>
                  renderGoalItem(goal, false, true),
                )}
              </ul>
            ) : (
              <p className="text-gray-600">
                No goals or achievements completed yet.
              </p>
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
              <p className="text-gray-600">
                You haven't followed anyone yet. Start following to see their
                updates!.
              </p>
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
