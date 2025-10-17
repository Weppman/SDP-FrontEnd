import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import PlanHike from "./planHike";
import { useUserContext } from "./context/userContext";
import axios from "axios";

jest.mock("axios");
jest.mock("./context/userContext");

const mockUserID = "user123";

const mockHikes = [
  { trailid: 1, name: "Trail A", location: "Loc1", difficulty: 2, duration: { hours: 2, minutes: 30, seconds: 0 }, description: "Nice trail" },
  { trailid: 2, name: "Trail B", location: "Loc2", difficulty: 3, duration: { hours: 1, minutes: 45, seconds: 0 }, description: "Another trail" },
];

const mockFriends = [
  { id: "f1", name: "Alice" },
  { id: "f2", name: "Bob" },
];

describe("PlanHike Component", () => {
  beforeEach(() => {
    useUserContext.mockReturnValue({ userID: mockUserID });
    axios.create.mockReturnValue(axios);
    axios.get.mockImplementation((url) => {
      if (url === "/trails") return Promise.resolve({ data: { trails: mockHikes } });
      if (url === `/friends/${mockUserID}`) return Promise.resolve({ data: { friends: mockFriends } });
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders header and hikes", async () => {
    render(<PlanHike />);
    expect(screen.getByText("Plan Hike")).toBeInTheDocument();
    expect(await screen.findByText("Trail A")).toBeInTheDocument();
    expect(await screen.findByText("Trail B")).toBeInTheDocument();
  });

  test("filters hikes based on name", async () => {
    render(<PlanHike />);
    const nameFilter = screen.getByLabelText(/name/i);
    fireEvent.change(nameFilter, { target: { value: "Trail A" } });
    expect(await screen.findByText("Trail A")).toBeInTheDocument();
    expect(screen.queryByText("Trail B")).toBeNull();
  });

  test("opens and closes plan hike modal", async () => {
    render(<PlanHike />);
    const trailToggle = await screen.findByText("Trail A");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));
    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);
    const planModal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    expect(within(planModal).getByText(/Plan Hike: Trail A/i)).toBeInTheDocument();
    fireEvent.click(within(planModal).getByText("Cancel"));
    expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument();
  });

  test("prevents planning with past date", async () => {
    render(<PlanHike />);
    const trailToggle = await screen.findByText("Trail A");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));
    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);
    const planModal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = planModal.querySelector('input[type="datetime-local"]');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    fireEvent.change(dateInput, { target: { value: pastDate.toISOString().slice(0,16) } });
    fireEvent.click(within(planModal).getByText("Plan Hike"));
    await waitFor(() => expect(screen.getByText(/Plan Hike: Trail A/i)).toBeInTheDocument());
  });

  test("plans hike with future date", async () => {
    render(<PlanHike />);
    const trailToggle = await screen.findByText("Trail A");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));
    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);
    const planModal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = planModal.querySelector('input[type="datetime-local"]');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { target: { value: futureDate.toISOString().slice(0,16) } });
    fireEvent.click(within(planModal).getByText("Plan Hike"));
    await waitFor(() => expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument());
  });

  test("invites friends correctly", async () => {
    render(<PlanHike />);
    const trailToggle = await screen.findByText("Trail A");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));
    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);
    const planModal = screen.getByText(/Plan Hike: Trail A/i).closest("section");
    const dateInput = planModal.querySelector('input[type="datetime-local"]');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { target: { value: futureDate.toISOString().slice(0,16) } });
    fireEvent.click(within(planModal).getByText("Invite"));
    const inviteModal = await screen.findByText("Invite Friends");
    const inviteModalSection = inviteModal.closest("section");
    const aliceButton = within(inviteModalSection).getByText("Alice").closest("li").querySelector("button");
    fireEvent.click(aliceButton);
    expect(aliceButton.textContent).toBe("Invited");
    fireEvent.click(within(inviteModalSection).getByText("Plan Hike"));
    await waitFor(() => expect(screen.queryByText(/Plan Hike: Trail A/i)).not.toBeInTheDocument());
  });
});
