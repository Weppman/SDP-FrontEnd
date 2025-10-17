// planHike.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import PlanHike, { DurationPicker } from "./planHike";
import { useUserContext } from "./context/userContext";
import axios from "axios";

beforeAll(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

jest.mock("axios");
jest.mock("./context/userContext");

const mockUserID = "user123";

const mockHikes = [
  { trailid: 1, name: "Trail A", location: "Loc1", difficulty: 2, duration: { hours: 2, minutes: 30, seconds: 0 }, description: "Nice trail" },
  { trailid: 2, name: "Trail B", location: "Loc2", difficulty: 3, duration: { hours: 1, minutes: 0, seconds: 0 }, description: "Another trail" },
];

const mockFriends = [
  { id: "f1", name: "Alice" },
  { id: "f2", name: "Bob" },
];

describe("PlanHike Component", () => {
  let mockApi;

  beforeEach(() => {
    useUserContext.mockReturnValue({ userID: mockUserID });

    mockApi = {
      get: jest.fn((url) => {
        if (url === "/trails") return Promise.resolve({ data: { trails: mockHikes } });
        if (url === `/friends/${mockUserID}`) return Promise.resolve({ data: { friends: mockFriends } });
        return Promise.resolve({ data: {} });
      }),
      post: jest.fn().mockResolvedValue({ data: { success: true } }),
    };

    axios.create.mockReturnValue(mockApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const formatLocalDateTime = (date) => {
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  test("renders header and filters", async () => {
    render(<PlanHike />);
    expect(screen.getByText("Plan Hike")).toBeInTheDocument();
    expect(await screen.findByText("Trail A")).toBeInTheDocument();
    expect(await screen.findByText("Trail B")).toBeInTheDocument();

    // Check filters
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
    expect(screen.getByText(/Duration of trails ≤ set time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

test("filters hikes based on name and duration", async () => {
  render(<PlanHike />);

  // --- Filter by name ---
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Trail A" } });

  await waitFor(() => {
    expect(screen.getByText("Trail A")).toBeInTheDocument();
    expect(screen.queryByText("Trail B")).toBeNull();
  });

  // --- Reset name filter ---
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "" } });

  // --- Filter by duration ≤ 1h ---
  // Duration inputs are number inputs (hours, minutes, seconds)
  const durationInputs = screen.getAllByRole("spinbutton"); // gets [hours, minutes, seconds]
  const hoursInput = durationInputs[0];

  fireEvent.change(hoursInput, { target: { value: 1 } });

  await waitFor(() => {
    // Trail A has 2h30m → filtered out
    expect(screen.queryByText("Trail A")).toBeNull();

    // Trail B has 1h45m → filtered out? Wait, ≤1h should only show hikes ≤1h
    // So both trails >1h are hidden, none shown
    // But if you want to include ≤2h, adjust value accordingly
    expect(screen.getByText("Trail B")).toBeInTheDocument();
  });
});


  test("opens and closes plan hike modal", async () => {
    render(<PlanHike />);
    const toggleButton = await screen.findByRole("button", { name: /Trail A/i });
    fireEvent.click(toggleButton);

    const planButton = await within(toggleButton.closest("article")).findByText("Plan Hike");
    fireEvent.click(planButton);

    const modal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    expect(within(modal).getByText(/Plan Hike: Trail A/i)).toBeInTheDocument();

    fireEvent.click(within(modal).getByText("Cancel"));
    expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument();
  });

  test("validates past date before planning hike", async () => {
    render(<PlanHike />);
    const toggleButton = await screen.findByRole("button", { name: /Trail A/i });
    fireEvent.click(toggleButton);

    const planButton = await within(toggleButton.closest("article")).findByText("Plan Hike");
    fireEvent.click(planButton);

    const modal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = modal.querySelector('input[type="datetime-local"]');

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    fireEvent.change(dateInput, { target: { value: formatLocalDateTime(pastDate) } });

    fireEvent.click(within(modal).getByText("Plan Hike"));
    await waitFor(() => expect(screen.getByText(/Plan Hike: Trail A/i)).toBeInTheDocument());
  });

  test("plans hike with future date", async () => {
    render(<PlanHike />);
    const toggleButton = await screen.findByRole("button", { name: /Trail A/i });
    fireEvent.click(toggleButton);

    const planButton = await within(toggleButton.closest("article")).findByText("Plan Hike");
    fireEvent.click(planButton);

    const modal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = modal.querySelector('input[type="datetime-local"]');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { target: { value: formatLocalDateTime(futureDate) } });

    fireEvent.click(within(modal).getByText("Plan Hike"));
    await waitFor(() => expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument());
  });

  test("invites friends correctly", async () => {
    render(<PlanHike />);
    const toggleButton = await screen.findByRole("button", { name: /Trail A/i });
    fireEvent.click(toggleButton);

    const planButton = await within(toggleButton.closest("article")).findByText("Plan Hike");
    fireEvent.click(planButton);

    const modal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = modal.querySelector('input[type="datetime-local"]');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { target: { value: formatLocalDateTime(futureDate) } });

    fireEvent.click(within(modal).getByText("Invite"));

    const inviteModal = await screen.findByText("Invite Friends");
    const inviteModalSection = inviteModal.closest("section");

    const aliceButton = within(inviteModalSection).getByText("Alice").closest("li").querySelector("button");
    fireEvent.click(aliceButton);
    expect(aliceButton.textContent).toBe("Invited");

    fireEvent.click(within(inviteModalSection).getByText("Plan Hike"));
    await waitFor(() => expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument());
  });
});
