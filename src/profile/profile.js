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
import { useUserContext } from "../context/userContext";
import { useEffect } from "react";
import Stats from "./stats";
import ViewProfileButton from "./viewProfile";
import { useParams } from "react-router-dom";

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

export default function Profile() {
  const { userID: routeUserID } = useParams(); // <-- get userID from URL
  const { userID: loggedInUserID } = useUserContext(); // optional
  const isOwnProfile = !routeUserID || routeUserID === loggedInUserID;
  const userID = isOwnProfile ? loggedInUserID : routeUserID;
  const [profileUser, setProfileUser] = useState(null);
  console.log("routeUserID:", routeUserID, "loggedInUserID:", loggedInUserID);
  console.log("Using userID:", userID);
  const API_URL = "https://sdp-backend-production.up.railway.app";
  const apiKey = process.env.REACT_APP_API_KEY;
  console.log(userID);
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
  const [globalGoals, setGlobalGoals] = useState([]);
  const [loadingGlobalGoals, setLoadingGlobalGoals] = useState(true);
  const [completedGlobalGoals, setCompletedGlobalGoals] = useState([]);
  const [loadingCompletedGlobal, setLoadingCompletedGlobal] = useState(true);
  const [completedPersonalGoals, setCompletedPersonalGoals] = useState([]);
  const [loadingCompletedPersonal, setLoadingCompletedPersonal] =
    useState(true);
  const [completedHikesData, setCompletedHikesData] = useState(null);
  const [loadingHikes, setLoadingHikes] = useState(true);
  const [profileFriends, setProfileFriends] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);

  // Clear ALL state when userID changes - this prevents stale data
  useEffect(() => {
    if (!userID) return;

    // Clear all state immediately when userID changes
    setProfileUser(null);
    setUserGoals([]);
    setGlobalGoals([]);
    setProfileFriends([]);
    setCompletedGlobalGoals([]);
    setCompletedPersonalGoals([]);
    setCompletedHikesData(null);

    // Reset loading states
    setLoadingGoals(true);
    setLoadingGlobalGoals(true);
    setLoadingCompletedGlobal(true);
    setLoadingCompletedPersonal(true);
    setLoadingHikes(true);
  }, [userID]);

  // Fetch profile friends - this should load the friends of the profile being viewed
  useEffect(() => {
    if (!loggedInUserID || !userID) return;

    async function fetchData() {
      try {
        // 1️⃣ Fetch my following first
        const myFollowingRes = await fetch(
          `${API_URL}/profile/${loggedInUserID}/friends`,
          {
            headers: { 'x-api-key': apiKey }
          }
        );
        const myFollowingData = await myFollowingRes.json();
        setMyFollowing(myFollowingData);

        // 2️⃣ Then fetch profile friends
        const profileRes = await fetch(`${API_URL}/profile/${userID}/friends`, {
          headers: { 'x-api-key': apiKey }
        });
        const profileData = await profileRes.json();
        setProfileFriends(profileData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setMyFollowing([]);
        setProfileFriends([]);
      }
    }

    fetchData();
  }, [loggedInUserID, userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchProfileUser = async () => {
      try {
        const res = await axios.post(`${API_URL}/uid`, { uidArr: [userID] }, {
          headers: { 'x-api-key': apiKey }
        });
        setProfileUser(res.data.userDatas[userID]);
      } catch (err) {
        console.error("Error fetching profile user:", err);
        setProfileUser(null);
      }
    };

    fetchProfileUser();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchGoals = async () => {
      setLoadingGoals(true);
      try {
        const res = await axios.get(`${API_URL}/profile/goals/${userID}`, {
          headers: { 'x-api-key': apiKey }
        });
        const goals = res.data.map((g) => ({
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
        setUserGoals([]);
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoals();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchGlobalGoals = async () => {
      setLoadingGlobalGoals(true);
      try {
        const res = await axios.get(
          `${API_URL}/profile/global-goals/${userID}`,
          {
            headers: { 'x-api-key': apiKey }
          }
        );
        setGlobalGoals(res.data);
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setGlobalGoals([]);
      } finally {
        setLoadingGlobalGoals(false);
      }
    };

    fetchGlobalGoals();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchCompletedHikes = async () => {
      setLoadingHikes(true);
      try {
        const res = await axios.get(
          `${API_URL}/profile/completed-hikes/${userID}`,
          {
            headers: { 'x-api-key': apiKey }
          }
        );
        setCompletedHikesData(res.data);
      } catch (err) {
        console.error("Error fetching completed hikes:", err);
        setCompletedHikesData(null);
      } finally {
        setLoadingHikes(false);
      }
    };

    fetchCompletedHikes();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchCompletedGlobal = async () => {
      setLoadingCompletedGlobal(true);
      try {
        const res = await axios.get(
          `${API_URL}/profile/completed-global/${userID}`,
          {
            headers: { 'x-api-key': apiKey }
          }
        );
        setCompletedGlobalGoals(res.data.goals);
      } catch (err) {
        console.error("Error fetching completed global goals:", err);
        setCompletedGlobalGoals([]);
      } finally {
        setLoadingCompletedGlobal(false);
      }
    };

    fetchCompletedGlobal();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchCompletedPersonal = async () => {
      setLoadingCompletedPersonal(true);
      try {
        const res = await axios.get(
          `${API_URL}/profile/completed-personal/${userID}`,
          {
            headers: { 'x-api-key': apiKey }
          }
        );
        setCompletedPersonalGoals(res.data.goals);
      } catch (err) {
        console.error("Error fetching completed personal goals:", err);
        setCompletedPersonalGoals([]);
      } finally {
        setLoadingCompletedPersonal(false);
      }
    };

    fetchCompletedPersonal();
  }, [userID]);

  // Toggle pin/unpin a hike
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
      const res = await axios.post(
        `${API_URL}/profile/add-goal/${userID}`,
        {
          title: newGoal.title,
          description: newGoal.description,
        },
        { 
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          } 
        },
      );

      setUserGoals((prev) => [...prev, res.data.goal]);
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
      const res = await axios.put(
        `${API_URL}/profile/edit-goal/${id}/${userID}`,
        {
          title: editingGoal.title,
          description: editingGoal.description,
        },
        { 
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          } 
        },
      );

      const updatedGoal = res.data.goal;

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
      const res = await axios.delete(
        `${API_URL}/profile/edit-goal/${goalToDelete.id}/${userID}`,
        {
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          },
        },
      );

      // Update UI
      setUserGoals(userGoals.filter((g) => g.id !== goalToDelete.id));
      setGoalToDelete(null);

      console.log("Deleted goal:", res.data.deletedGoalId);
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

  const handleUnfollow = async (friendId) => {
    try {
      await fetch(`${API_URL}/follow/${friendId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          'x-api-key': apiKey
        },
        credentials: "include",
        body: JSON.stringify({ followerId: loggedInUserID }),
      });

      // Only update profileFriends if we're on our own profile
      if (isOwnProfile) {
        setProfileFriends((prev) =>
          prev.filter((f) => Number(f.id) !== Number(friendId)),
        );
      }

      // Update my following list
      setMyFollowing((prev) =>
        prev.filter((f) => Number(f.id) !== Number(friendId)),
      );
    } catch (err) {
      console.error("Error unfollowing user:", err);
    }
  };

  console.log("profile user id:", userID);
  const isFollowingProfileUser = myFollowing.some(
    (f) => Number(f.id) === Number(userID),
  );

  const handleFollowToggleProfile = async (profileId) => {
    const currentlyFollowing = myFollowing.some(
      (f) => Number(f.id) === Number(profileId),
    );

    try {
      if (currentlyFollowing) {
        // Unfollow
        await fetch(`${API_URL}/follow/${profileId}`, {
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          },
          credentials: "include",
          body: JSON.stringify({ followerId: loggedInUserID }),
        });

        // Remove from myFollowing
        setMyFollowing((prev) =>
          prev.filter((f) => Number(f.id) !== Number(profileId)),
        );

        // Don't modify profileFriends here - it should only show who the profile owner follows
      } else {
        // Follow
        await fetch(`${API_URL}/follow/${profileId}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          },
          credentials: "include",
          body: JSON.stringify({ followerId: loggedInUserID }),
        });

        // Add to myFollowing - use existing profileUser data
        const newFollow = {
          id: Number(profileId), // Ensure consistent number type
          username: profileUser?.username || "Unknown",
          imageUrl: profileUser?.imageUrl || "",
        };

        setMyFollowing((prev) => [...prev, newFollow]);

        // Don't modify profileFriends here - it should only show who the profile owner follows
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleMarkDone = async (goalId) => {
    try {
      const res = await axios.put(
        `${API_URL}/profile/mark-done/${goalId}/${userID}`,
        {},
        { 
          headers: { 
            "Content-Type": "application/json",
            'x-api-key': apiKey
          } 
        },
      );

      const updatedGoal = res.data.goal;

      // Remove from active goals
      setUserGoals((prev) => prev.filter((g) => g.id !== goalId));

      // Add to completed goals
      setCompletedPersonalGoals((prev) => [
        ...prev,
        { ...updatedGoal, source: "personal" },
      ]);
    } catch (err) {
      console.error("Error marking goal as done:", err);
    }
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
            <span
              onClick={() => handleSaveEdit(goal.id)}
              className="cursor-pointer rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800 transition hover:bg-blue-200"
            >
              Save
            </span>
          )}
          {editable && editingGoalId !== goal.id && (
            <span
              onClick={() => handleEditClick(goal)}
              className="cursor-pointer rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800 transition hover:bg-blue-200"
            >
              Edit
            </span>
          )}
          {editable && (
            <span
              onClick={() => confirmDelete(goal)}
              className="cursor-pointer rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800 transition hover:bg-red-200"
            >
              Delete
            </span>
          )}
          {editable && !goal.done && (
            <span
              onClick={() => handleMarkDone(goal.id)}
              className="cursor-pointer rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800 transition hover:bg-green-200"
            >
              Mark Done
            </span>
          )}

          {showShare && (
            <>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(
                    `I completed the goal "${goal.title}" (${goal.target} done)!`,
                  );
                  alert("Copied to clipboard!");
                }}
                className="cursor-pointer rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800 transition hover:bg-blue-200"
              >
                Copy
              </span>
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
            src={friend.imageUrl || "https://i.pravatar.cc/50?img=1"}
            alt={`@${friend.username}`}
            className="h-12 w-12 rounded-full"
          />
        </div>
        <section>
          <h3 className="font-semibold text-gray-800">{friend.username}</h3>
        </section>
      </section>

      <menu className="flex space-x-2">
        <ViewProfileButton userID={friend.id} />
        {isOwnProfile && (
          <button
            onClick={() => handleUnfollow(friend.id)}
            className="rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-500"
          >
            Unfollow
          </button>
        )}
      </menu>
    </li>
  );

  const completedGoals = [...completedGlobalGoals, ...completedPersonalGoals];
  const tabs = [
    // Only show Achievements & Goals if viewing your own profile
    ...(isOwnProfile
      ? [
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
        ]
      : []),
    // Always show these tabs
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
  ];

  return (
    <main className="p-6 pt-20">
      <section className="w-full rounded-lg bg-gray-50 p-6 shadow-md">
        {/* Profile Header */}
        <section className="mb-6 flex items-center space-x-4">
          <img
            src={profileUser?.imageUrl || "fallback-avatar.png"}
            alt={profileUser?.username || "User Avatar"}
            className="h-20 w-20 rounded-full"
          />
          <section>
            <h1 className="text-2xl font-bold text-gray-800">
              {profileUser?.username || "Some Person"}
            </h1>
            <p className="text-gray-600">Avid hiker & goal achiever</p>
            <p className="mt-1 text-sm text-gray-500">
              {userGoals.filter((g) => g.current < g.target).length} personal
              goals • {hikes.length} hikes pinned • {profileFriends.length}{" "}
              following
            </p>

            {/* Follow/Unfollow button */}
            {!isOwnProfile && profileUser && (
              <button
                onClick={() => handleFollowToggleProfile(userID)}
                className={`mt-2 rounded px-4 py-2 font-medium text-white transition ${
                  isFollowingProfileUser
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-green-700 hover:bg-green-500"
                }`}
              >
                {isFollowingProfileUser ? "Unfollow" : "Follow"}
              </button>
            )}
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
        <nav className="flex w-full border-b-2 border-gray-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 pb-2 text-center font-semibold transition-colors ${isActive ? "border-b-2 border-green-700 text-green-700" : "text-gray-500 hover:text-green-500"}`}
              >
                {tab.icon}
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        {isOwnProfile && activeTab === "global" && (
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

        {isOwnProfile && activeTab === "personal" && (
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
                  renderGoalItem(goal, false, isOwnProfile),
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
            {profileFriends.length ? (
              <ul className="space-y-3">
                {profileFriends.map((friend) => renderFriendItem(friend))}
              </ul>
            ) : (
              <p className="text-gray-600">
                This user isn't following anyone yet.
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
