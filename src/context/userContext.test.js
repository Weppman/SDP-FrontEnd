import React from "react";
import { render, waitFor } from "@testing-library/react";
import { UserProvider, useUserContext } from "./userContext";
import * as clerk from "@clerk/clerk-react";
import axios from "axios";

jest.mock("@clerk/clerk-react");
jest.mock("axios");

describe("UserContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets userData correctly when user exists", async () => {
    const mockUser = { id: "auth123" };
    clerk.useUser.mockReturnValue({ user: mockUser, isLoaded: true });
    clerk.useAuth.mockReturnValue({ getToken: jest.fn().mockResolvedValue("token123") });

    axios.get.mockResolvedValueOnce({
      data: { user: { userid: 1, authid: "auth123", biography: "bio" } },
    });

    let contextValue;
    const TestComponent = () => {
      contextValue = useUserContext();
      return null;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => expect(contextValue.userID).toBe(1));
    expect(contextValue.authID).toBe("auth123");
    expect(contextValue.biography).toBe("bio");
    expect(contextValue.status).toBe("user");
  });

  it("sets userData to visitor when no user", async () => {
    clerk.useUser.mockReturnValue({ user: null, isLoaded: true });
    clerk.useAuth.mockReturnValue({ getToken: jest.fn() });

    let contextValue;
    const TestComponent = () => {
      contextValue = useUserContext();
      return null;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => expect(contextValue.status).toBe("visitor"));
    expect(contextValue.userID).toBeNull();
    expect(contextValue.authID).toBeNull();
    expect(contextValue.biography).toBe("");
  });

  it("handles backend errors gracefully", async () => {
    const mockUser = { id: "auth123" };
    clerk.useUser.mockReturnValue({ user: mockUser, isLoaded: true });
    clerk.useAuth.mockReturnValue({ getToken: jest.fn().mockResolvedValue("token123") });

    axios.get.mockRejectedValue(new Error("Backend failure"));

    let contextValue;
    const TestComponent = () => {
      contextValue = useUserContext();
      return null;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(contextValue.status).toBe("visitor");
      expect(contextValue.userID).toBeNull();
      expect(contextValue.authID).toBeNull();
    });
  });

  it("inserts new user if not exists", async () => {
    const mockUser = { id: "auth999" };
    clerk.useUser.mockReturnValue({ user: mockUser, isLoaded: true });
    clerk.useAuth.mockReturnValue({ getToken: jest.fn().mockResolvedValue("token999") });

    axios.get.mockResolvedValueOnce({ data: { user: null } });
    axios.post.mockResolvedValueOnce({
      data: { user: { userid: 99, authid: "auth999", biography: "" } },
    });

    let contextValue;
    const TestComponent = () => {
      contextValue = useUserContext();
      return null;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(contextValue.userID).toBe(99);
      expect(contextValue.status).toBe("user");
      expect(contextValue.authID).toBe("auth999");
      expect(contextValue.biography).toBe("");
    });
  });
});
