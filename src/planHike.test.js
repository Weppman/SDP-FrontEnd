// planHike.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlanHike, { DurationPicker } from "./planHike.js";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";

jest.mock("axios");

const mockUserContext = { userID: "123" };
jest.mock("./context/userContext.js", () => ({
  useUserContext: jest.fn(),
}));

describe("PlanHike Component", () => {
  let mockGet, mockPost;

  beforeEach(() => {
    useUserContext.mockReturnValue(mockUserContext);

    // Mock axios instance
    mockGet = jest.fn()
      // first call returns trails
      .mockResolvedValueOnce({
        data: {
          trails: [
            { trailid: 1, name: "Hike1", duration: "01:00:00", difficulty: 3, location: "TestLoc", description: "TestDesc" }
          ]
        }
      })
      // second call returns friends (if component fetches friends)
      .mockResolvedValueOnce({
        data: {
          friends: [
            { id: "f1", name: "Alice" },
            { id: "f2", name: "Bob" }
          ]
        }
      });

    mockPost = jest.fn().mockResolvedValue({ data: { success: true } });

    axios.create.mockReturnValue({
      get: mockGet,
      post: mockPost
    });
  });

  test("renders filters and hikes list", async () => {
    render(<PlanHike />);
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Hike1/i)).toBeInTheDocument();
    });
  });

  test("expands hike details when clicked", async () => {
    render(<PlanHike />);
    await waitFor(() => screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Hike1/i));
    expect(screen.getByText(/Location:/i)).toBeInTheDocument();
    expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
    expect(screen.getByText(/Description:/i)).toBeInTheDocument();
  });

  test("opens and closes plan hike modal", async () => {
    render(<PlanHike />);
    await waitFor(() => screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Plan Hike/i));
    expect(screen.getByText(/Plan Hike: Hike1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByText(/Plan Hike: Hike1/i)).not.toBeInTheDocument();
  });

  test("handles planning a hike", async () => {
    render(<PlanHike />);
    await waitFor(() => screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Plan Hike/i));

    const input = screen.getByLabelText(/Planned Date/i) || screen.getByDisplayValue("");
    fireEvent.change(input, { target: { value: "2099-01-01T10:00" } });

    fireEvent.click(screen.getByText(/^Plan Hike$/i));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
  });

  test("opens invite modal and toggles friends", async () => {
    render(<PlanHike />);
    await waitFor(() => screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Hike1/i));
    fireEvent.click(screen.getByText(/Invite/i));

    await waitFor(() => screen.getByText(/Invite Friends/i));
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Invite/i));
    expect(screen.getByText(/Invited/i)).toBeInTheDocument();
  });

  test("DurationPicker works correctly", () => {
    let value = "";
    render(<DurationPicker value="03:00:00" onChange={(v) => value = v} />);
    const inputs = screen.getAllByRole("spinbutton");

    fireEvent.change(inputs[0], { target: { value: 1 } });
    fireEvent.change(inputs[1], { target: { value: 2 } });
    fireEvent.change(inputs[2], { target: { value: 3 } });

    expect(value).toBe("01:02:03");
  });

  test("filters by name, location, difficulty, duration, description", async () => {
    render(<PlanHike />);
    await waitFor(() => screen.getByText(/Hike1/i));
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Hike1" } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: "TestLoc" } });
    fireEvent.change(screen.getByLabelText(/Difficulty/i), { target: { value: "3" } });
    // duration filtering depends on your component, you may need to target hour/min/sec inputs separately
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "TestDesc" } });
    expect(screen.getByText(/Hike1/i)).toBeInTheDocument();
  });
});
