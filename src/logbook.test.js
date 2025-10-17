// logbook.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Logbook from "./logbook";
import { useUserContext } from "./context/userContext.js";
import axios from "axios";

jest.mock("axios");
jest.mock("./context/userContext.js");

const mockUserID = "user123";

// Mock Axios instance returned by axios.create
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  useUserContext.mockReturnValue({ userID: mockUserID });
  axios.create.mockReturnValue(mockAxiosInstance);
  jest.clearAllMocks();
});

describe("Logbook Component", () => {
  it("renders loading message when no userID", () => {
    useUserContext.mockReturnValue({ userID: null });
    render(<Logbook />);
    expect(screen.getByText(/loading user information/i)).toBeInTheDocument();
  });

  it("renders upcoming and completed hikes", async () => {
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes("completed-hikes")) {
        return Promise.resolve({ data: { rows: [{ completedhikeid: 1, userid: 1, name: "Test Hike", date: "2025-09-28", timespan: "01:30:00" }] } });
      }
      if (url.includes("upcoming-hikes")) {
        return Promise.resolve({ data: { rows: [{ plannerid: 2, name: "Upcoming Hike", planned_at: "2025-10-01T10:00:00", has_started: false }] } });
      }
      if (url.includes("pending-hikes")) {
        return Promise.resolve({ data: { pendingHikes: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    mockAxiosInstance.post.mockResolvedValue({ data: { userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } } } });

    render(<Logbook />);

    await waitFor(() => expect(screen.getByText("Test Hike")).toBeInTheDocument());
    expect(screen.getByText("Upcoming Hike")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Test Hike"));
    expect(screen.getByText(/01:30:00/)).toBeInTheDocument();
  });

  it("opens and closes edit modal", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { rows: [{ completedhikeid: 1, userid: 1, name: "Test Hike", date: "2025-09-28", timespan: "01:30:00" }] } });
    mockAxiosInstance.post.mockResolvedValue({ data: { userDatas: { "1": { username: "Alice" } } } });

    render(<Logbook />);

    const completedSection = screen.getByText("Completed Hikes").closest("section");
    await waitFor(() => within(completedSection).getByText("Test Hike"));

    fireEvent.click(within(completedSection).getByText("Test Hike"));
    fireEvent.click(within(completedSection).getByText("Edit"));

    expect(screen.getByText(/Edit Hike/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/Edit Hike/i)).not.toBeInTheDocument();
  });

  it("filters completed hikes by name", async () => {
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes("completed-hikes")) {
        return Promise.resolve({ data: { rows: [{ completedhikeid: 1, userid: 1, name: "Alpha Hike", date: "2025-09-28", timespan: "01:00:00" }] } });
      }
      if (url.includes("upcoming-hikes")) {
        return Promise.resolve({ data: { rows: [{ plannerid: 2, name: "Beta Hike", planned_at: "2025-10-01T10:00:00", has_started: false }] } });
      }
      return Promise.resolve({ data: { pendingHikes: [] } });
    });
    mockAxiosInstance.post.mockResolvedValue({ data: { userDatas: { "1": { username: "Alice" }, "2": { username: "Bob" } } } });

    render(<Logbook />);
    await waitFor(() => screen.getByText("Alpha Hike"));

    const nameInput = screen.getByLabelText("name", { selector: 'input#name' });
    fireEvent.change(nameInput, { target: { value: "Beta" } });

    expect(screen.queryByText("Alpha Hike")).not.toBeInTheDocument();
  });

  it("starts and stops upcoming hikes", async () => {
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes("upcoming-hikes")) return Promise.resolve({ data: { rows: [{ plannerid: 2, name: "Test Hike", planned_at: "2025-10-01T10:00:00", has_started: false }] } });
      if (url.includes("completed-hikes")) return Promise.resolve({ data: { rows: [] } });
      return Promise.resolve({ data: { pendingHikes: [] } });
    });
    mockAxiosInstance.post.mockImplementation((url) => {
      if (url === "/start-hike") return Promise.resolve({ data: { success: true, planned_at: "2025-10-01T10:00:00" } });
      if (url === "/stop-hike") return Promise.resolve({ data: { success: true } });
      return Promise.resolve({ data: {} });
    });

    render(<Logbook />);

    const hikeButton = await screen.findByText("Test Hike");
    fireEvent.click(hikeButton);

    fireEvent.click(screen.getByText("Start"));
    const stopButton = await screen.findByText("Stop");
    fireEvent.click(stopButton);

    await waitFor(() => expect(screen.queryByText("Stop")).not.toBeInTheDocument());
  });

  it("accepts and declines pending invites", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { rows: [], pendingHikes: [{ hikeid: 1, name: "Invite Hike", madeby: 2, location: "Trail", difficulty: "Medium", duration: "01:00:00", description: "Test" }] },
    });
    mockAxiosInstance.post.mockResolvedValue({ data: { success: true, userDatas: { "2": { username: "Bob" } } } });

    render(<Logbook />);
    await waitFor(() => screen.getByText(/Invite from/));

    const inviteHeader = screen.getByText(/Invite from/);
    fireEvent.click(inviteHeader);

    const inviteSection = inviteHeader.closest("section");
    fireEvent.click(within(inviteSection).getByText("Accept"));
    fireEvent.click(within(inviteSection).getByText("Decline"));
  });

  it("opens delete confirmation modal and cancels", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { rows: [], pendingHikes: [], "upcoming-hikes": [{ plannerid: 3, name: "Delete Me", planned_at: "2025-10-01T10:00:00", has_started: false }] },
    });

    render(<Logbook />);
    const hikeButton = await screen.findByText("Delete Me");
    fireEvent.click(hikeButton);

    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument();
  });

  it("confirms deletion of upcoming hike", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { rows: [], pendingHikes: [], "upcoming-hikes": [{ plannerid: 4, name: "Hike to Delete", planned_at: "2025-10-01T10:00:00", has_started: false }] },
    });
    mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

    render(<Logbook />);
    const hikeButton = await screen.findByText("Hike to Delete");
    fireEvent.click(hikeButton);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes, Delete"));

    await waitFor(() => expect(screen.queryByText("Hike to Delete")).not.toBeInTheDocument());
  });

  it("pins and unpins a completed hike", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { rows: [{ completedhikeid: 5, userid: 1, name: "Pin Me", timespan: "01:00:00" }] } });
    mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

    render(<Logbook />);
    const hikeButton = await screen.findByText("Pin Me");
    fireEvent.click(hikeButton);

    const pinButton = screen.getByText("Pin");
    fireEvent.click(pinButton);
    await waitFor(() => expect(screen.getByText("Pinned")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Pinned"));
    await waitFor(() => expect(screen.getByText("Pin")).toBeInTheDocument());
  });

  it("handles subtractHours utility", () => {
    const { subtractHours } = require("./logbook.js");
    expect(subtractHours("2025-10-01 12:00:00", 2)).toContain("10"); // hour reduced by 2
    expect(subtractHours(null)).toBe("Unknown");
  });

  it("handles API errors gracefully", async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error("Network Error"));
    render(<Logbook />);
    await waitFor(() => screen.getByText(/No upcoming hikes found/i));
  });
});
