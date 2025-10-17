const React = require("react");
const { render, screen, fireEvent, waitFor, within } = require("@testing-library/react");
const Logbook = require("./logbook").default;
const { useUserContext } = require("./context/userContext.js");
const axios = require("axios");

jest.mock("axios");
jest.mock("./context/userContext.js");

const mockUserID = "user123";

describe("Logbook Component", () => {
  let mockApiClient;

  beforeEach(() => {
    useUserContext.mockReturnValue({ userID: mockUserID });
    mockApiClient = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };
    axios.create.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading message when no userID", () => {
    useUserContext.mockReturnValue({ userID: null });
    render(<Logbook />);
    expect(screen.getByText(/loading user information/i)).toBeInTheDocument();
  });

  it("renders upcoming and completed hikes with adjusted times", async () => {
    const completedHikeData = [{ completedhikeid: 1, name: "Test Hike", date: "2025-09-28", timespan: "01:30:00" }];
    const upcomingHikeData = [{ plannerid: 2, name: "Upcoming Hike", planned_at: "2025-10-01 12:00:00", has_started: false }];

    mockApiClient.get.mockImplementation((url) => {
      if (url.includes("completed-hikes")) return Promise.resolve({ data: { rows: completedHikeData } });
      if (url.includes("upcoming-hikes")) return Promise.resolve({ data: { rows: upcomingHikeData } });
      if (url.includes("pending-hikes")) return Promise.resolve({ data: { pendingHikes: [] } });
      return Promise.resolve({ data: {} });
    });

    mockApiClient.post.mockResolvedValue({
      data: {
        userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } }
      }
    });

    render(<Logbook />);

    // Check completed hikes render
    expect(await screen.findByText("Test Hike")).toBeInTheDocument();

    // Check upcoming hike renders and subtractHours is applied
    const upcoming = await screen.findByText("Upcoming Hike");
    fireEvent.click(upcoming);

    // subtractHours subtracts 2 hours
    const adjustedDate = new Date("2025-10-01T12:00:00Z");
    adjustedDate.setUTCHours(adjustedDate.getUTCHours() - 2);
    const formatted = adjustedDate.toLocaleString();

    expect(screen.getByText(new RegExp(formatted))).toBeInTheDocument();

    // Check timespan displayed correctly
    fireEvent.click(screen.getByText("Test Hike"));
    expect(screen.getByText("01:30:00")).toBeInTheDocument();
  });

  it("opens and closes edit modal", async () => {
    mockApiClient.get.mockResolvedValue({ data: { rows: [{ completedhikeid: 1, name: "Test Hike", date: "2025-09-28", timespan: "01:30:00" }] } });
    mockApiClient.post.mockResolvedValue({ data: { userDatas: { "1": { username: "Alice" } } } });

    render(<Logbook />);
    const completedSection = await screen.findByText("Completed Hikes").then(el => el.closest("section"));

    fireEvent.click(within(completedSection).getByText("Test Hike"));
    fireEvent.click(within(completedSection).getByText("Edit"));

    expect(await screen.findByText(/Timespan/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText(/Timespan/i)).not.toBeInTheDocument());
  });

  it("filters completed hikes by name", async () => {
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes("completed-hikes")) return Promise.resolve({ data: { rows: [{ completedhikeid: 1, name: "Alpha Hike", date: "2025-09-28", timespan: "01:00:00" }] } });
      if (url.includes("upcoming-hikes")) return Promise.resolve({ data: { rows: [{ plannerid: 2, name: "Beta Hike", planned_at: "2025-10-01 12:00:00", has_started: false }] } });
      if (url.includes("pending-hikes")) return Promise.resolve({ data: { pendingHikes: [] } });
      return Promise.resolve({ data: {} });
    });
    mockApiClient.post.mockResolvedValue({ data: { userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } } } });

    render(<Logbook />);
    await screen.findByText("Alpha Hike");

    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Beta" } });
    await waitFor(() => expect(screen.queryByText("Alpha Hike")).not.toBeInTheDocument());
  });

  it("starts and stops upcoming hikes", async () => {
    mockApiClient.get.mockImplementation((url) => {
      if (url.includes("upcoming-hikes")) return Promise.resolve({ data: { rows: [{ plannerid: 2, name: "Test Hike", planned_at: "2025-10-01 12:00:00", has_started: false }] } });
      if (url.includes("completed-hikes")) return Promise.resolve({ data: { rows: [] } });
      if (url.includes("pending-hikes")) return Promise.resolve({ data: { pendingHikes: [] } });
      return Promise.resolve({ data: {} });
    });
    mockApiClient.post.mockImplementation((url) => {
      if (url === "/start-hike") return Promise.resolve({ data: { success: true } });
      if (url === "/stop-hike") return Promise.resolve({ data: { success: true } });
      return Promise.resolve({ data: {} });
    });

    render(<Logbook />);
    const hikeButton = await screen.findByText("Test Hike");
    fireEvent.click(hikeButton);

    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Stop"));

    await waitFor(() => expect(screen.queryByText("Stop")).not.toBeInTheDocument());
  });

  it("accepts and declines pending invites", async () => {
    mockApiClient.get.mockResolvedValue({ data: { pendingHikes: [{ hikeid: 1, name: "Invite Hike", madeby: 2, location: "Trail", difficulty: "Medium", duration: "01:00:00", description: "Test" }] } });
    mockApiClient.post.mockResolvedValue({ data: { success: true, userDatas: { "2": { username: "Bob" } } } });

    render(<Logbook />);
    const inviteHeader = await screen.findByText(/Invite from/);
    const inviteSection = inviteHeader.closest("section");

    fireEvent.click(inviteHeader);
    fireEvent.click(within(inviteSection).getByText("Accept"));
    fireEvent.click(within(inviteSection).getByText("Decline"));
  });
});
