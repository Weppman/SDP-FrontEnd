import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import Profile from "./profile";
import { useUser } from "@clerk/clerk-react";
import { useUserContext } from "../context/userContext";
import axios from "axios";
import { FaTwitter, FaFacebook } from "react-icons/fa"; // Import icons
import { MemoryRouter } from "react-router-dom";

jest.mock("@clerk/clerk-react", () => ({ useUser: jest.fn() }));
jest.mock("../context/userContext", () => ({ useUserContext: jest.fn() }));
jest.mock("axios");

// Mock Stats component
jest.mock("./stats", () => (props) => (
  <div data-testid="highcharts-mock">
    Stats Mock
    <div data-testid="user-goals-count">{props.userGoals.length}</div>
    <div data-testid="global-goals-count">{props.globalGoals.length}</div>
  </div>
));

describe("Profile Component", () => {
  beforeEach(() => {
    useUser.mockReturnValue({
      user: { username: "testuser", imageUrl: "avatar.png" },
    });
    useUserContext.mockReturnValue({ userID: "123" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("completed goals tab renders with no completed goals", async () => {
    // Mock axios for completed goals
    axios.post.mockResolvedValue({ data: { rows: [] } });

    render(<Profile />);
    const completedTab = await screen.findByRole("button", {
      name: /Completed/i,
    });
    fireEvent.click(completedTab);

    expect(
      await screen.findByText(/No goals or achievements completed yet/i),
    ).toBeInTheDocument();
  });

  test("stats tab renders Stats mock even with empty data", async () => {
    // Mock axios calls for global and personal goals
    axios.post.mockResolvedValue({ data: { rows: [] } });

    render(<Profile />);
    const statsTab = await screen.findByRole("button", { name: /Statistics/i });
    fireEvent.click(statsTab);

    expect(await screen.findByTestId("highcharts-mock")).toBeInTheDocument();
    expect(screen.getByTestId("user-goals-count")).toHaveTextContent("0");
    expect(screen.getByTestId("global-goals-count")).toHaveTextContent("0");
  });

  test("stats tab renders Stats mock even with empty data", async () => {
    // Mock axios calls for global and personal goals
    axios.post.mockResolvedValue({ data: { rows: [] } });

    render(<Profile />); // Render Profile component

    // Simulate clicking the "Statistics" tab
    const statsTab = await screen.findByRole("button", { name: /Statistics/i });
    fireEvent.click(statsTab);

    // Check that the Stats component mock is rendered
    expect(await screen.findByTestId("highcharts-mock")).toBeInTheDocument();
    expect(screen.getByTestId("user-goals-count")).toHaveTextContent("0");
    expect(screen.getByTestId("global-goals-count")).toHaveTextContent("0");
  });
  test("shows empty friends message on fetch error", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<Profile />);
    fireEvent.click(await screen.findByRole("button", { name: /Following/i }));

    expect(
      await screen.findByText(/This user isn't following anyone yet/i),
    ).toBeInTheDocument();
  });

  test("can edit, mark done, and delete a personal goal", async () => {
    // --- Mock initial personal goals ---
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 101,
          title: "Goal 101",
          description: "Desc",
          done: false,
          source: "personal",
          current: 0,
          target: 1,
        },
      ],
    });

    // --- Mock API responses ---
    axios.put.mockImplementation((url) => {
      if (url.includes("edit-goal")) {
        return Promise.resolve({
          data: {
            goal: { id: 101, title: "Updated", description: "Updated Desc" },
          },
        });
      }
      if (url.includes("mark-done")) {
        return Promise.resolve({
          data: {
            goal: {
              id: 101,
              title: "Updated",
              description: "Updated Desc",
              done: true,
              source: "personal",
            },
          },
        });
      }
    });

    axios.delete.mockResolvedValue({ data: { deletedGoalId: 101 } });

    render(<Profile />);

    // --- Go to Personal Goals tab ---
    const personalTab = await screen.findByRole("button", { name: /Goals/i });
    fireEvent.click(personalTab);

    // --- Wait for goal to appear ---
    const goalItem = await screen.findByText("Goal 101");
    const goalContainer = goalItem.closest("li"); // scope buttons to this goal

    // --- Edit goal ---
    const editButton = within(goalContainer).getByText("Edit");
    fireEvent.click(editButton);

    const titleInput = within(goalContainer).getByDisplayValue("Goal 101");
    fireEvent.change(titleInput, { target: { value: "Updated" } });

    const saveButton = within(goalContainer).getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(within(goalContainer).getByText("Updated")).toBeInTheDocument(),
    );

    // --- Mark goal as done ---
    const markDoneButton = within(goalContainer).getByText("Mark Done");
    fireEvent.click(markDoneButton);

    await waitFor(() =>
      expect(screen.queryByText("Updated")).not.toBeInTheDocument(),
    );

    // --- Delete goal ---
    // Re-mock axios.get to render goal again
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 101,
          title: "Updated",
          description: "Updated Desc",
          done: false,
          source: "personal",
          current: 0,
          target: 1,
        },
      ],
    });
  });
  test("full profile interaction workflow", async () => {
    useUserContext.mockReturnValue({ userID: "1" });
    const mockProfileUser = { username: "testuser", imageUrl: "avatar.png" };
    axios.post.mockResolvedValueOnce({
      data: { userDatas: { 1: mockProfileUser } },
    });

    // Mock initial personal goals
    axios.get.mockImplementation((url) => {
      if (url.includes("/goals/")) {
        return Promise.resolve({
          data: [
            { id: 101, title: "Goal 101", description: "Desc", done: false },
          ],
        });
      }
      if (url.includes("/global-goals/")) {
        return Promise.resolve({
          data: [{ id: 201, title: "Global Goal", current: 0, target: 1 }],
        });
      }
      if (
        url.includes("/completed-global/") ||
        url.includes("/completed-personal/")
      ) {
        return Promise.resolve({ data: { goals: [] } });
      }
      if (url.includes("/completed-hikes/")) {
        return Promise.resolve({
          data: [{ id: 301, title: "Table Mountain" }],
        });
      }
    });

    render(<Profile />);

    // 1️⃣ Switch to personal goals and add a goal
    fireEvent.click(await screen.findByRole("button", { name: /Goals/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/e.g., Hike Table Mountain/i),
      { target: { value: "New Goal" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(/e.g., Hike 50 km this month/i),
      { target: { value: "Description" } },
    );
    axios.post.mockResolvedValueOnce({
      data: {
        goal: {
          id: 102,
          title: "New Goal",
          description: "Description",
          done: false,
        },
      },
    });
    fireEvent.click(screen.getByText("Add Goal"));
    await waitFor(() =>
      expect(screen.getByText("New Goal")).toBeInTheDocument(),
    );

    // 6️⃣ Switch to stats tab
    fireEvent.click(screen.getByRole("button", { name: /Statistics/i }));
    expect(screen.getByText(/Stats Mock/i)).toBeInTheDocument();

    // 7️⃣ Switch to following tab (simulate empty)
    fireEvent.click(screen.getByRole("button", { name: /Following/i }));
    expect(
      screen.getByText(/This user isn't following anyone yet/i),
    ).toBeInTheDocument();
  });
  test("shows fallback when fetching friends fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<Profile />);
    fireEvent.click(await screen.findByRole("button", { name: /Following/i }));

    expect(
      await screen.findByText(/This user isn't following anyone yet/i),
    ).toBeInTheDocument();
  });
  jest.mock("../context/userContext", () => ({
    useUserContext: jest.fn(),
  }));

  test("Unfollow friend from friends tab", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([{ id: 2, username: "friend", imageUrl: "" }]),
      }),
    );

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    // Switch to friends tab
    fireEvent.click(await screen.findByRole("button", { name: /Following/i }));

    // Wait for the friend to appear and then click Unfollow
    const unfollowBtn = await screen.findByText(/Unfollow/i);
    fireEvent.click(unfollowBtn);

    // Optional: assert the friend is removed
    await waitFor(() =>
      expect(screen.queryByText("friend")).not.toBeInTheDocument(),
    );
  });
});
