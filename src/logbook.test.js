const React = require("react");
const { render, screen, fireEvent, waitFor, within } = require("@testing-library/react");
const Logbook = require("./logbook").default;
const { useUserContext } = require("./context/userContext.js");
const axios = require("axios");

jest.mock("axios");
jest.mock("./context/userContext.js");

const mockUserID = "user123";

describe("Logbook Component", function () {
  let mockApiClient;

  beforeEach(function () {
    useUserContext.mockReturnValue({ userID: mockUserID });

    // Mock axios.create to return an object with get, post, delete methods
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };
    axios.create.mockReturnValue(mockApiClient);
  });

  afterEach(function () {
    jest.clearAllMocks();
  });

  it("renders loading message when no userID", function () {
    useUserContext.mockReturnValue({ userID: null });
    render(<Logbook />);
    expect(screen.getByText(/loading user information/i)).toBeInTheDocument();
  });

  it("renders upcoming and completed hikes", async function () {
    mockApiClient.get.mockImplementation((url) => {
      if (url === `/completed-hikes/${mockUserID}`) {
        return Promise.resolve({
          data: {
            rows: [
              {
                completedhikeid: 1,
                name: "Test Hike",
                date: "2025-09-28",
                timespan: "01:30:00",
              },
            ],
          },
        });
      }
      if (url === `/upcoming-hikes/${mockUserID}`) {
        return Promise.resolve({
          data: {
            rows: [
              {
                plannerid: 2,
                name: "Upcoming Hike",
                planned_at: "2025-10-01T10:00:00",
                has_started: false,
              },
            ],
          },
        });
      }
      if (url === `/pending-hikes/${mockUserID}`) {
        return Promise.resolve({ data: { pendingHikes: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    mockApiClient.post.mockResolvedValue({
      data: { userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } } },
    });

    render(<Logbook />);

    await waitFor(() => expect(screen.getByText("Test Hike")).toBeInTheDocument());
    expect(screen.getByText("Upcoming Hike")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Test Hike"));
    expect(screen.getByText("01:30:00")).toBeInTheDocument();
  });

  it("opens and closes edit modal", async () => {
    mockApiClient.get.mockResolvedValue({
      data: {
        rows: [{ completedhikeid: 1, name: "Test Hike", date: "2025-09-28", timespan: "01:30:00" }],
      },
    });
    mockApiClient.post.mockResolvedValue({
      data: { userDatas: { "1": { username: "Alice" } } },
    });

    render(<Logbook />);

    const completedSection = await screen.findByText("Completed Hikes").closest("section");

    const hikeButton = within(completedSection).getByText("Test Hike");
    fireEvent.click(hikeButton);

    const editButton = within(completedSection).getByText("Edit");
    fireEvent.click(editButton);

    // Check for modal label "Timespan"
    expect(screen.getByText(/Timespan/i)).toBeInTheDocument();

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByText(/Timespan/i)).not.toBeInTheDocument();
  });

  it("filters completed hikes by name", async () => {
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes("completed-hikes")) {
        return Promise.resolve({
          data: {
            rows: [
              { completedhikeid: 1, name: "Alpha Hike", date: "2025-09-28", timespan: "01:00:00" },
            ],
          },
        });
      }
      if (url.includes("upcoming-hikes")) {
        return Promise.resolve({
          data: {
            rows: [
              { plannerid: 2, name: "Beta Hike", planned_at: "2025-10-01T10:00:00", has_started: false },
            ],
          },
        });
      }
      if (url.includes("pending-hikes")) {
        return Promise.resolve({ data: { pendingHikes: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    mockApiClient.post.mockResolvedValue({
      data: { userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } } },
    });

    render(<Logbook />);

    await waitFor(() => screen.getByText("Alpha Hike"));

    const nameInput = screen.getByLabelText("name");
    fireEvent.change(nameInput, { target: { value: "Beta" } });

    await waitFor(() => expect(screen.queryByText("Alpha Hike")).not.toBeInTheDocument());
  });

  it("starts and stops upcoming hikes", async () => {
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes("upcoming-hikes")) {
        return Promise.resolve({
          data: {
            rows: [
              { plannerid: 2, name: "Test Hike", planned_at: "2025-10-01T10:00:00", has_started: false },
            ],
          },
        });
      }
      if (url.includes("completed-hikes")) {
        return Promise.resolve({ data: { rows: [] } });
      }
      if (url.includes("pending-hikes")) {
        return Promise.resolve({ data: { pendingHikes: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    mockApiClient.post.mockImplementation((url) => {
      if (url === "/start-hike") {
        return Promise.resolve({ data: { success: true, planned_at: "2025-10-01T10:00:00" } });
      }
      if (url === "/stop-hike") {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<Logbook />);

    const hikeButton = await screen.findByText("Test Hike");
    fireEvent.click(hikeButton);

    const startButton = screen.getByText("Start");
    fireEvent.click(startButton);

    const stopButton = await screen.findByText("Stop");
    fireEvent.click(stopButton);

    await waitFor(() => expect(screen.queryByText("Stop")).not.toBeInTheDocument());
  });

  it("accepts and declines pending invites", async () => {
    mockApiClient.get.mockResolvedValue({
      data: {
        pendingHikes: [
          {
            hikeid: 1,
            name: "Invite Hike",
            madeby: 2,
            location: "Trail",
            difficulty: "Medium",
            duration: "01:00:00",
            description: "Test",
          },
        ],
      },
    });
    mockApiClient.post.mockResolvedValue({
      data: { success: true, userDatas: { "2": { username: "Bob" } } },
    });

    render(<Logbook />);

    await waitFor(() => screen.getByText(/Invite from/));

    const inviteHeader = screen.getByText(/Invite from/);
    fireEvent.click(inviteHeader);

    const inviteSection = inviteHeader.closest("section");
    const acceptButton = within(inviteSection).getByText("Accept");
    const declineButton = within(inviteSection).getByText("Decline");

    fireEvent.click(acceptButton);
    fireEvent.click(declineButton);
  });
});
