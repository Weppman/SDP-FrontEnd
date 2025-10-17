// planHike.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlanHike, { DurationPicker } from "./planHike";
import axios from "axios";
import { useUserContext } from "./context/userContext.js";

jest.mock("axios");

const mockUserContext = { userID: "123" };
jest.mock("./context/userContext.js", () => ({
  useUserContext: jest.fn(),
}));

describe("PlanHike Component", () => {
  beforeEach(() => {
    useUserContext.mockReturnValue(mockUserContext);
    axios.create = jest.fn(() => axios);
    axios.get.mockResolvedValue({
      data: { trails: [{ trailid: 1, name: "Hike1", duration: "01:00:00", difficulty: 3 }] },
    });
    axios.post.mockResolvedValue({ data: { success: true } });
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

    // Set a valid future date
    const input = screen.getByDisplayValue("");
    fireEvent.change(input, { target: { value: "2099-01-01T10:00" } });
    fireEvent.click(screen.getByText(/Plan Hike$/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test("opens invite modal and toggles friends", async () => {
    axios.get.mockResolvedValueOnce({
      data: { trails: [{ trailid: 1, name: "Hike1", duration: "01:00:00", difficulty: 3 }] },
    }).mockResolvedValueOnce({
      data: { friends: [{ id: "f1", name: "Alice" }, { id: "f2", name: "Bob" }] },
    });

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
    render(<DurationPicker value="00:00:00" onChange={(v) => value = v} />);
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
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Difficulty/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/Duration of trails ≤ set time/i), { target: { value: "01:00:00" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "" } });
    expect(screen.getByText(/Hike1/i)).toBeInTheDocument();
  });
});
