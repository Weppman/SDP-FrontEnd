// search.test.js
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import SearchUsersUI from "./search";
import { useUserContext } from "../context/userContext";
import { BrowserRouter as Router } from "react-router-dom";

// Mock the context
jest.mock("../context/userContext", () => ({
  useUserContext: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("SearchUsersUI Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders suggested users and allows follow toggle", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({
          json: () => Promise.resolve([{ id: 2 }]), // Alice is already friend
        });
      }
      if (url.includes("/users/random")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              users: [
                { id: 2, username: "Alice", imageUrl: "" },
                { id: 3, username: "Bob", imageUrl: "" },
              ],
            }),
        });
      }
      if (url.includes("/follow/3")) {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for suggested users
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Find buttons using `within`
    const aliceCard = screen.getByText("Alice").closest("li");
    const bobCard = screen.getByText("Bob").closest("li");

    const aliceButton = within(aliceCard).getByText("Unfollow"); // Already friend
    const bobButton = within(bobCard).getByText("Follow"); // Not friend

    // Click follow on Bob
    fireEvent.click(bobButton);

    await waitFor(() => {
      expect(within(bobCard).getByText("Unfollow")).toBeInTheDocument();
    });
  });

  test("searches users and displays results with follow toggle", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({
          json: () => Promise.resolve([{ id: 2 }]), // Alice is friend
        });
      }
      if (url.includes("/users/search?username=Charlie")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              users: [
                { id: 3, username: "Charlie", imageUrl: "" },
                { id: 4, username: "Dana", imageUrl: "" },
              ],
            }),
        });
      }
      if (url.includes("/follow/3")) {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Type username and press Enter
    const input = screen.getByPlaceholderText("Enter username...");
    fireEvent.change(input, { target: { value: "Charlie" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText("Dana")).toBeInTheDocument();
    });

    // Find follow buttons within each user card
    const charlieCard = screen.getByText("Charlie").closest("li");
    const danaCard = screen.getByText("Dana").closest("li");

    const charlieButton = within(charlieCard).getByText("Follow");
    const danaButton = within(danaCard).getByText("Follow");

    // Click follow on Charlie
    fireEvent.click(charlieButton);

    await waitFor(() => {
      expect(within(charlieCard).getByText("Unfollow")).toBeInTheDocument();
    });
  });
  test("refreshes suggested users when refresh button is clicked", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    // Initial suggested users
    const initialUsers = [
      { id: 2, username: "Alice", imageUrl: "" },
      { id: 3, username: "Bob", imageUrl: "" },
    ];

    // New suggested users after refresh
    const newUsers = [
      { id: 4, username: "Eve", imageUrl: "" },
      { id: 5, username: "Frank", imageUrl: "" },
    ];

    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({
          json: () => Promise.resolve([{ id: 2 }]), // Alice is already friend
        });
      }
      if (url.includes("/users/random")) {
        // Return different users depending on how many times fetch was called
        if (fetch.mock.calls.length <= 2) {
          return Promise.resolve({
            json: () => Promise.resolve({ users: initialUsers }),
          });
        } else {
          return Promise.resolve({
            json: () => Promise.resolve({ users: newUsers }),
          });
        }
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for initial users
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByTitle("Refresh");
    fireEvent.click(refreshButton);

    // Wait for new users to appear
    await waitFor(() => {
      expect(screen.getByText("Eve")).toBeInTheDocument();
      expect(screen.getByText("Frank")).toBeInTheDocument();
      // Old users should no longer be present
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });
  });
  test("displays message when search returns no users", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    // Mock fetch for friends and search
    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes("/users/search?username=NonExistentUser")) {
        return Promise.resolve({
          json: () => Promise.resolve({ users: [] }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Type a username that doesn't exist and press Enter
    const input = screen.getByPlaceholderText("Enter username...");
    fireEvent.change(input, { target: { value: "NonExistentUser" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Wait for "No users found" message
    await waitFor(() => {
      expect(
        screen.getByText("No users found. Try another username."),
      ).toBeInTheDocument();
    });
  });
  test("logs error when fetching friends fails", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Make fetch reject for friends
    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching friends:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
  test("logs error when fetching suggested users fails", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Make fetch reject for suggested users
    fetch.mockImplementation((url) => {
      if (url.includes("/users/random")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for the fetchSuggestedUsers error to be caught
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching suggested users:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
  test("logs error when search fails", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock fetch: friends succeed, search fails
    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }
      if (url.includes("/users/search")) {
        return Promise.reject(new Error("Search network error"));
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Type a username and press Enter to trigger search
    const input = screen.getByPlaceholderText("Enter username...");
    fireEvent.change(input, { target: { value: "TestUser" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Wait for the search error to be caught
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Search error:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
  test("unfollows a user and updates friends state", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const friendsMock = [{ id: 2 }];
    const suggestedUsersMock = [{ id: 2, username: "Bob", imageUrl: "" }];

    fetch.mockImplementation((url, options) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({ json: () => Promise.resolve(friendsMock) });
      }
      if (url.includes("/users/random")) {
        return Promise.resolve({
          json: () => Promise.resolve({ users: suggestedUsersMock }),
        });
      }
      if (url.includes("/follow/2") && options.method === "DELETE") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for suggested users to load
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Button should initially be "Unfollow" because user 2 is in friends
    const unfollowButton = screen.getByText("Unfollow");
    fireEvent.click(unfollowButton);

    // After click, button should become "Follow"
    await waitFor(() => {
      expect(screen.getByText("Follow")).toBeInTheDocument();
    });
  });
  test("logs error when follow/unfollow fails", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const suggestedUsersMock = [{ id: 2, username: "Bob", imageUrl: "" }];

    // Mock fetch: friends empty, follow fetch fails
    fetch.mockImplementation((url, options) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }
      if (url.includes("/users/random")) {
        return Promise.resolve({
          json: () => Promise.resolve({ users: suggestedUsersMock }),
        });
      }
      if (url.includes("/follow/2")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ json: () => Promise.resolve({ users: [] }) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for suggested users to appear
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Click follow button
    const followButton = screen.getByText("Follow");
    fireEvent.click(followButton);

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error toggling follow:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
  test("handleSearch filters out current user and displays results", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    // Mock fetch for search
    fetch.mockImplementation((url) => {
      if (url.includes("/users/search")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              users: [
                { id: 1, username: "Alice" }, // should be filtered out
                { id: 2, username: "Bob" },
              ],
            }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Type a search query and press Enter
    const input = screen.getByPlaceholderText("Enter username...");
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Wait for results to appear
    await waitFor(() => {
      // Current user "Alice" should NOT appear
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      // Other user "Bob" should appear
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });
  test("handleSearch fetches users and filters out current user", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    // Mock fetch for search
    fetch.mockImplementation((url) => {
      if (url.includes("/users/search")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              users: [
                { id: 1, username: "Alice" }, // current user, should be filtered out
                { id: 2, username: "Bob" }, // should appear
                { id: 3, username: "Charlie" }, // should appear
              ],
            }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Type a search query and press Enter
    const input = screen.getByPlaceholderText("Enter username...");
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Wait for results to appear
    await waitFor(() => {
      // Current user "Alice" should NOT appear
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      // Other users should appear
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
  });
  test("renders avatar correctly and triggers initial fetch", async () => {
    useUserContext.mockReturnValue({ userID: 1 });

    const suggestedUsersMock = [
      { id: 2, username: "Bob", imageUrl: "bob.jpg" }, // has image
      { id: 3, username: "Charlie" }, // no image
    ];

    const friendsMock = [{ id: 4 }];

    fetch.mockImplementation((url) => {
      if (url.includes("/profile/1/friends")) {
        return Promise.resolve({ json: () => Promise.resolve(friendsMock) });
      }
      if (url.includes("/users/random")) {
        return Promise.resolve({
          json: () => Promise.resolve({ users: suggestedUsersMock }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    render(
      <Router>
        <SearchUsersUI />
      </Router>,
    );

    // Wait for suggested users to appear
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    // Check avatar rendering
    const bobImg = screen.getByAltText("Bob");
    expect(bobImg).toBeInTheDocument();
    expect(bobImg).toHaveAttribute("src", "bob.jpg");

    const charlieInitial = screen.getByText("C");
    expect(charlieInitial).toBeInTheDocument();

    // Find the nearest div ancestor with the avatar classes
    const avatarDiv = charlieInitial.closest("div");
    expect(avatarDiv).toHaveClass(
      "flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-500",
    );
  });
});
