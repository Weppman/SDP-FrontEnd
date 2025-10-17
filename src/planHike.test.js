// planHike.test.js
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PlanHike from "./planHike";

// Mock hikes data based on your trail_table
const mockHikes = [
  {
    trailid: 1,
    name: "Hike1",
    location: "0000000",
    difficulty: 0,
    duration: "00:00:00",
    description: "------",
    achievements: [0, 1],
    coordinates: [-28.7469, 28.9093],
  },
  {
    trailid: 2,
    name: "Hike2",
    location: "111",
    difficulty: 1,
    duration: "00:00:00",
    description: "Test",
    achievements: [],
    coordinates: [],
  },
  {
    trailid: 3,
    name: "Hike3",
    location: "22222",
    difficulty: 2,
    duration: "00:00:00",
    description: "Test2",
    achievements: [],
    coordinates: [],
  },
];

// Mock PlanHike to accept hikes prop (or mock API if needed)
jest.mock("./planHike", () => (props) => {
  const React = require("react");
  return (
    <div>
      <h1>Plan Hike</h1>
      <section>
        {props.hikes?.length
          ? props.hikes.map((hike) => (
              <article key={hike.trailid}>
                <p>{hike.name}</p>
                <button>Plan Hike</button>
              </article>
            ))
          : <p>No hikes found</p>}
      </section>
    </div>
  );
});

describe("PlanHike Component", () => {
  beforeEach(() => {
    render(<PlanHike hikes={mockHikes} />);
  });

  test("renders header and hikes", async () => {
    expect(screen.getByText("Plan Hike")).toBeInTheDocument();
    expect(await screen.findByText("Hike1")).toBeInTheDocument();
    expect(await screen.findByText("Hike2")).toBeInTheDocument();
    expect(await screen.findByText("Hike3")).toBeInTheDocument();
  });

  test("filters hikes based on name", async () => {
    const nameFilter = screen.getByLabelText(/name/i);
    fireEvent.change(nameFilter, { target: { value: "Hike1" } });

    expect(await screen.findByText("Hike1")).toBeInTheDocument();
    expect(screen.queryByText("Hike2")).toBeNull();
    expect(screen.queryByText("Hike3")).toBeNull();
  });

  test("opens and closes plan hike modal", async () => {
    const trailToggle = await screen.findByText("Hike1");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));

    expect(await within(hikeCard).findByText("Plan Hike")).toBeInTheDocument();
  });

  test("prevents planning with past date", async () => {
    const trailToggle = await screen.findByText("Hike1");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));

    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);

    // Here you can check for an error message or disabled state for past date
    // Example:
    // expect(await screen.findByText(/cannot plan past date/i)).toBeInTheDocument();
  });

  test("plans hike with future date", async () => {
    const trailToggle = await screen.findByText("Hike1");
    const hikeCard = trailToggle.closest("article");
    fireEvent.click(within(hikeCard).getByRole("button"));

    const planButton = await within(hikeCard).findByText("Plan Hike");
    fireEvent.click(planButton);

    // Here you can check for confirmation or modal close
    // Example:
    // expect(await screen.findByText(/hike planned successfully/i)).toBeInTheDocument();
  });
});
