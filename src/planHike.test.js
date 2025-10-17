// planHike.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlanHike, { DurationPicker } from "./planHike";
import axios from "axios";
import { useUserContext } from "./context/userContext";

jest.mock("axios");
jest.mock("./context/userContext");

describe("PlanHike Component", () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create to return mockGet and mockPost
    axios.create.mockReturnValue({ get: mockGet, post: mockPost });

    // Default user context
    useUserContext.mockReturnValue({ userID: "123" });
  });

  test("renders loading state and hikes", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        trails: [
          { trailid: 1, name: "Trail1", location: "Loc1", difficulty: 3, duration: "01:30:00", description: "Nice trail" }
        ]
      }
    });

    render(<PlanHike />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => screen.getByText("Trail1"));
    expect(screen.getByText("Trail1")).toBeInTheDocument();
    expect(screen.getByText("Loc1")).toBeInTheDocument();
    expect(screen.getByText("Nice trail")).toBeInTheDocument();
  });

  test("expands hike details when clicked", async () => {
    mockGet.mockResolvedValueOnce({
      data: { trails: [{ trailid: 1, name: "Trail1", location: "Loc1", difficulty: 3, duration: "01:30:00", description: "Nice trail" }] }
    });

    render(<PlanHike />);

    await waitFor(() => screen.getByText("Trail1"));

    fireEvent.click(screen.getByText("Trail1"));

    expect(screen.getByText(/Location:/i)).toBeInTheDocument();
    expect(screen.getByText(/Difficulty:/i)).toBeInTheDocument();
    expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
    expect(screen.getByText(/Description:/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan Hike/i)).toBeInTheDocument();
  });

  test("opens and closes Plan Hike modal", async () => {
    mockGet.mockResolvedValueOnce({
      data: { trails: [{ trailid: 1, name: "Trail1", location: "Loc1", difficulty: 3, duration: "01:30:00", description: "Nice trail" }] }
    });

    render(<PlanHike />);
    await waitFor(() => screen.getByText("Trail1"));

    fireEvent.click(screen.getByText("Trail1"));
    fireEvent.click(screen.getByText("Plan Hike"));

    expect(screen.getByText(/Plan Hike: Trail1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByText(/Plan Hike: Trail1/i)).not.toBeInTheDocument();
  });

  test("DurationPicker calls onChange with correct formatted time", () => {
    const onChangeMock = jest.fn();
    render(<DurationPicker value="00:00:00" onChange={onChangeMock} />);

    const hourInput = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(hourInput, { target: { value: 1 } });

    expect(onChangeMock).toHaveBeenCalledWith("01:00:00");
  });

  test("filters hikes by duration and difficulty", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        trails: [
          { trailid: 1, name: "Trail1", location: "Loc1", difficulty: 3, duration: "01:30:00", description: "Nice" },
          { trailid: 2, name: "Trail2", location: "Loc2", difficulty: 5, duration: "02:00:00", description: "Hard" }
        ]
      }
    });

    render(<PlanHike />);
    await waitFor(() => screen.getByText("Trail1"));

    const durationInput = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(durationInput, { target: { value: 1 } }); // hours = 1

    const difficultySelect = screen.getByLabelText("difficulty");
    fireEvent.change(difficultySelect, { target: { value: "3" } });

    expect(screen.getByText("Trail1")).toBeInTheDocument();
    expect(screen.queryByText("Trail2")).not.toBeInTheDocument();
  });

  test("handles planning hike API call", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const plannedDate = futureDate.toISOString().slice(0,16);

    mockGet.mockResolvedValueOnce({
      data: { trails: [{ trailid: 1, name: "Trail1", location: "Loc1", difficulty: 3, duration: "01:30:00", description: "Nice trail" }] }
    });

    mockPost.mockResolvedValueOnce({ data: { success: true } });

    render(<PlanHike />);
    await waitFor(() => screen.getByText("Trail1"));

    fireEvent.click(screen.getByText("Trail1"));
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: plannedDate } });
    fireEvent.click(screen.getByText("Plan Hike"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/plan-hike", expect.objectContaining({
        trailId: 1,
        userId: "123",
        plannedAt: plannedDate,
        invitedFriends: []
      }));
    });
  });

});
