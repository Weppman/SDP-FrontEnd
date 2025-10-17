// planHike.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlanHike, { DurationPicker } from "./planHike";
import axios from "axios";
import { useUserContext } from "./context/userContext";

jest.mock("axios");
jest.mock("./context/userContext");

describe("PlanHike component", () => {
  const mockUser = { userID: "123" };

  beforeEach(() => {
    useUserContext.mockReturnValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders trails in the select dropdown", async () => {
    // Mock API response
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: "Trail1", duration: 120 },
        { id: 2, name: "Trail2", duration: 90 },
      ],
    });

    render(<PlanHike />);

    // Wait for select to appear
    const trailSelect = await screen.findByRole("combobox");

    // Check if options exist
    expect(screen.getByRole("option", { name: "Trail1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Trail2" })).toBeInTheDocument();
  });

  it("lets the user select a trail", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: "Trail1", duration: 120 },
        { id: 2, name: "Trail2", duration: 90 },
      ],
    });

    render(<PlanHike />);

    const trailSelect = await screen.findByRole("combobox");

    // Simulate selecting Trail1
    fireEvent.change(trailSelect, { target: { value: "1" } });

    expect(trailSelect.value).toBe("1");
  });

  it("filters trails based on duration", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: "Trail1", duration: 120 },
        { id: 2, name: "Trail2", duration: 90 },
      ],
    });

    render(<PlanHike />);

    const durationInput = screen.getByLabelText(/Duration of trails/i);
    fireEvent.change(durationInput, { target: { value: "100" } });

    const trailSelect = await screen.findByRole("combobox");

    // Only Trail2 should remain
    expect(screen.queryByRole("option", { name: "Trail1" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Trail2" })).toBeInTheDocument();
  });
});

// Optional: DurationPicker test
describe("DurationPicker component", () => {
  it("updates hours, minutes, and seconds correctly", () => {
    const handleChange = jest.fn();
    render(<DurationPicker value={{ hours: 0, minutes: 0, seconds: 0 }} onChange={handleChange} />);

    const hoursInput = screen.getByLabelText(/Hours/i);
    fireEvent.change(hoursInput, { target: { value: "2" } });

    expect(handleChange).toHaveBeenCalledWith({ hours: 2, minutes: 0, seconds: 0 });
  });
});
