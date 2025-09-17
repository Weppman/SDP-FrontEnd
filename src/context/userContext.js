import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [userData, setUserData] = useState({
    userID: null,
    authID: null,
    biography: "",
    status: "visitor",
  });

  const API_URL = "https://sdp-backend-production.up.railway.app";

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (!isLoaded) return;
      if (!user) {
        setUserData({ userID: null, authID: null, biography: "", status: "visitor" });
        return;
      }

      try {
        const token = await getToken();
        const authID = user.id;

        // 1️⃣ Check if user exists
        const res = await axios.get(`${API_URL}/user/${authID}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        let userInfo;
        if (!res.data.user) {
          // 2️⃣ User doesn't exist → create
          const createRes = await axios.post(
            `${API_URL}/user`,
            { authID, biography: "" },
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          );
          userInfo = createRes.data.user;
        } else {
          userInfo = res.data.user;
        }

        setUserData({
          userID: userInfo.userid,
          authID: authID,
          biography: userInfo.biography || "",
          status: "user",
        });
      } catch (err) {
        console.error("Error syncing user with backend:", err);
      }
    };

    syncUserWithBackend();
  }, [user, isLoaded, getToken]);

  return <UserContext.Provider value={userData}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
