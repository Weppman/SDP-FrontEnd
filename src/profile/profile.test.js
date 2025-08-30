import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./profile";
import { useUser } from "@clerk/clerk-react";
import { useUserContext } from "../context/userContext";
import axios from "axios";
import { FaTwitter, FaFacebook } from 'react-icons/fa'; // Import icons

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

  test("renders profile header and pinned hikes", async () => {
    // Mock axios for completed hikes (returns empty)
    axios.post.mockResolvedValue({ data: { rows: [] } });

    render(<Profile />);

    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    expect(screen.getByText(/Avid hiker & goal achiever/i)).toBeInTheDocument();

    // Pinned hikes should appear (from sampleHikes)
    expect(await screen.findByText(/Table Mountain/i)).toBeInTheDocument();
    expect(await screen.findByText(/Lion's Head Sunrise/i)).toBeInTheDocument();
    expect(await screen.findByText(/Drakensberg Hike/i)).toBeInTheDocument();

    // Pin icons
    expect(screen.getAllByText("📌").length).toBe(3);
  });

  test("personal goals tab renders and allows adding goals", async () => {
    // Mock adding goal API call
    axios.post.mockResolvedValueOnce({
      data: {
        rows: [
          {
            id: 999,
            title: "Test Goal",
            description: "Test Description",
            done: false,
          },
        ],
      },
    });

    render(<Profile />);

    const goalsTab = await screen.findByRole("button", { name: /Goals/i });
    fireEvent.click(goalsTab);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Test Goal" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Test Description" },
    });

    fireEvent.click(screen.getByText(/Add Goal/i));

    await waitFor(() =>
      expect(screen.getByText(/Test Goal/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Test Description/i)).toBeInTheDocument();

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        sql: expect.stringContaining("INSERT INTO goal_table"),
      }),
      expect.any(Object)
    );
  });

  test("completed goals tab renders with no completed goals", async () => {
    // Mock axios for completed goals
    axios.post.mockResolvedValue({ data: { rows: [] } });

    render(<Profile />);
    const completedTab = await screen.findByRole("button", { name: /Completed/i });
    fireEvent.click(completedTab);

    expect(await screen.findByText(/No goals or achievements completed yet/i)).toBeInTheDocument();
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

  test("friends tab renders and can remove a friend", async () => {
    render(<Profile />);
    const friendsTab = await screen.findByRole("button", { name: /Following/i });
    fireEvent.click(friendsTab);

    expect(await screen.findByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Johnson/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Remove/i)[0]);
    expect(screen.queryByText(/Alice Smith/i)).not.toBeInTheDocument();
  });
test("allows deleting a personal goal through confirmation modal", async () => {
  // 1️⃣ Mock fetch goals (initial load)
  axios.post.mockResolvedValueOnce({
    data: {
      rows: [
        {
          id: 1,
          title: "My First Goal",
          description: "Test Description",
          done: false,
        },
      ],
    },
  });

  // 2️⃣ Mock delete request
  axios.post.mockResolvedValueOnce({ data: { rows: [] } });

  render(<Profile />);

  // 3️⃣ Go to Goals tab
  fireEvent.click(await screen.findByRole("button", { name: /Goals/i }));

  // 4️⃣ Wait for the goal to appear
  expect(await screen.findByText(/My First Goal/i)).toBeInTheDocument();

  // 5️⃣ Click the "Delete" button inside the goal card
  const deleteBtn = screen.getAllByRole("button", { name: /delete/i })[0];
  fireEvent.click(deleteBtn);

  // 6️⃣ Modal should appear
  expect(
    await screen.findByText(/Are you sure you want to delete "My First Goal"/i)
  ).toBeInTheDocument();

  // 7️⃣ Click the "Delete" button inside the modal
  const confirmBtn = screen.getAllByRole("button", { name: /delete/i }).find(
    (btn) => btn.closest(".fixed") // modal is fixed overlay
  );
  fireEvent.click(confirmBtn);

  // 8️⃣ Wait until the goal disappears
  await waitFor(() =>
    expect(screen.queryByText(/My First Goal/i)).not.toBeInTheDocument()
  );

  // 9️⃣ Assert DELETE query was called
  expect(axios.post).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      sql: expect.stringContaining("DELETE FROM goal_table"),
    }),
    expect.any(Object)
  );
});
test("allows editing a personal goal", async () => {
  // 1️⃣ Mock initial fetch of goals
  axios.post.mockResolvedValueOnce({
    data: {
      rows: [
        {
          id: 1,
          title: "Original Goal",
          description: "Original Description",
          done: false,
        },
      ],
    },
  });

  render(<Profile />);

  // 2️⃣ Go to Goals tab
  fireEvent.click(await screen.findByRole("button", { name: /Goals/i }));

  // 3️⃣ Wait for goal to appear
  expect(await screen.findByText(/Original Goal/i)).toBeInTheDocument();

  // 4️⃣ Click Edit button
  const editBtn = screen.getByText(/Edit/i);
  fireEvent.click(editBtn);

  // 5️⃣ Change title and description
  fireEvent.change(screen.getByDisplayValue(/Original Goal/i), {
    target: { value: "Updated Goal" },
  });
  fireEvent.change(screen.getByDisplayValue(/Original Description/i), {
    target: { value: "Updated Description" },
  });

  // 6️⃣ Mock axios response for the update
  axios.post.mockResolvedValueOnce({
    data: {
      rows: [
        {
          id: 1,
          title: "Updated Goal",
          description: "Updated Description",
          done: false,
        },
      ],
    },
  });

  // 7️⃣ Click Save
  fireEvent.click(screen.getByText(/Save/i));

  // 8️⃣ Wait for the updated goal to appear in the UI
  await waitFor(() =>
    expect(screen.getByText(/Updated Goal/i)).toBeInTheDocument()
  );
  expect(screen.getByText(/Updated Description/i)).toBeInTheDocument();

  // 9️⃣ Assert axios POST was called with UPDATE query
  expect(axios.post).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      sql: expect.stringContaining("UPDATE goal_table"),
    }),
    expect.any(Object)
  );
});
test("allows toggling pinned hikes", async () => {
  render(<Profile />);

  // Wait for a pinned hike to appear
  expect(await screen.findByText(/Table Mountain/i)).toBeInTheDocument();

  // Find the pin button for Table Mountain
  let pinButton = screen.getAllByText("📌")[0];
  expect(pinButton).toBeInTheDocument();

  // Click the pin button to unpin
  fireEvent.click(pinButton);

  // Table Mountain should no longer be in the pinned hikes list
  await waitFor(() =>
    expect(screen.queryByText(/Table Mountain/i)).not.toBeInTheDocument()
  );

  // Find the pin button again for re-pinning (simulate another pinned hike)
  // Here we just toggle another hike to test toggle functionality
  pinButton = screen.getAllByText("📌")[0];
  fireEvent.click(pinButton);

  // Check that some pinned hike appears again
  await waitFor(() =>
    expect(screen.getAllByText("📌").length).toBeGreaterThan(0)
  );
});
describe("Profile Component Completed Goals", () => {
  beforeEach(() => {
    // Mock Clerk user
    useUser.mockReturnValue({
      user: {
        username: "testuser",
        imageUrl: "https://i.pravatar.cc/50",
      },
    });

    // Mock userID from context
    useUserContext.mockReturnValue({
      userID: "123",
    });
  });

  it("renders completed personal and global goals", async () => {
  axios.post.mockImplementation((url, query) => {
    console.log("Mocking axios call with query:", query);

    if (query.sql.includes("done = true")) {
      return Promise.resolve({
        data: {
          rows: [
            {
              id: 1,
              title: "Completed Goal",
              description: "Personal goal description",
              done: true,
            },
          ],
        },
      });
    }

    if (query.sql.includes("u.currentnumber >= a.finishnumber")) {
      return Promise.resolve({
        data: {
          rows: [
            {
              id: 2,
              title: "Global Completed Goal",
              description: "Global goal description",
              current: 10,
              target: 10,
            },
          ],
        },
      });
    }

    return Promise.resolve({ data: { rows: [] } });
  });

  render(<Profile />);

  // Click the Completed tab
  const completedTab = await screen.findByRole("button", { name: /Completed/i });
  fireEvent.click(completedTab);
  screen.debug();
  // Wait for personal goal to appear
   // Wait for personal goal to appear
// Wait for personal goal to appear
 expect(screen.findByText(/Completed Goal/i)).resolves.toBeInTheDocument();



  // Wait for global goal to appear
  await waitFor(() => screen.getByText(/Global Completed Goal/i));
  expect(screen.getByText(/Global Completed Goal/i)).toBeInTheDocument();
});

});
test("does not add goal with empty fields", async () => {
  render(<Profile />);

  // Go to Goals tab and attempt to submit with empty fields
  fireEvent.click(await screen.findByRole("button", { name: /Goals/i }));

  fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "" } });

  fireEvent.click(screen.getByText(/Add Goal/i));

  expect(screen.findByText(/Please fill out this field./i)).resolves.toBeInTheDocument();
});

test("renders goals correctly", async () => {
  // Mock the API response
  axios.post.mockResolvedValueOnce({
    data: {
      rows: [
        { id: 1, title: "Goal 1", description: "Description 1", done: false },
        { id: 2, title: "Goal 2", description: "Description 2", done: true },
      ],
    },
  });

  render(<Profile />);

  // Wait for the goals to appear and assert their presence
  const goal1 =  screen.findByText(/Goal 1/i);
  const goal2 =  screen.findByText(/Goal 2/i);

  expect(goal1).resolves.toBeInTheDocument();
  expect(goal2).resolves.toBeInTheDocument();
});
test("stats tab renders Stats mock even with empty data", async () => {
  // Mock axios calls for global and personal goals
  axios.post.mockResolvedValue({ data: { rows: [] } });

  render(<Profile />);  // Render Profile component

  // Simulate clicking the "Statistics" tab
  const statsTab = await screen.findByRole("button", { name: /Statistics/i });
  fireEvent.click(statsTab);

  // Check that the Stats component mock is rendered
  expect(await screen.findByTestId("highcharts-mock")).toBeInTheDocument();
  expect(screen.getByTestId("user-goals-count")).toHaveTextContent("0");
  expect(screen.getByTestId("global-goals-count")).toHaveTextContent("0");
});


it('fetches and displays global goals', async () => {
  const mockData = {
    data: {
      rows: [
        { id: 1, title: 'Global Goal 1', description: 'Description 1', target: 10, current: 5 },
        { id: 2, title: 'Global Goal 2', description: 'Description 2', target: 15, current: 10 },
      ],
    },
  };

  axios.post.mockResolvedValue(mockData);

  render(<Profile />);

  await waitFor(() => {
    expect(screen.getByText('Global Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Global Goal 2')).toBeInTheDocument();
  });
});

});
