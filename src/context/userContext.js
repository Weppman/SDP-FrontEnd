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
    status: "visitor", // default
  });

  const API_URL = "https://sdp-backend-production.up.railway.app/query";

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (!isLoaded) return; // wait for Clerk
      if (!user) {
        setUserData({ userID: null, authID: null, biography: "", status: "visitor" });
        return;
      }

      try {
        const token = await getToken();
        const authID = user.id;

        // Check if user exists
        const selectQuery = { sql: `SELECT * FROM usertable WHERE authid='${authID}' LIMIT 1` };
        const res = await axios.post(API_URL, selectQuery, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        let userInfo;
        if (!res.data.rows || res.data.rows.length === 0) {
          // Insert new user
          const insertQuery = { sql: `INSERT INTO usertable (authid, biography) VALUES ('${authID}', '') RETURNING *` };
          const insertRes = await axios.post(API_URL, insertQuery, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          userInfo = insertRes.data.rows[0];
        } else {
          // User exists
          userInfo = res.data.rows[0];
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
