// src/toolbar/toolbar.test.js
import React from "react";
import { render, screen } from "@testing-library/react";

// Mock react-router-dom completely so Jest never tries to load it
jest.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock AuthPanel
jest.mock("../authHandling/authPanel", () => () => <div data-testid="auth-panel" />);

// Now import your component
import Toolbar from "./toolbar";

describe("Toolbar", () => {
  it("renders all navigation links", () => {
    render(<Toolbar />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Logbook")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders AuthPanel", () => {
    render(<Toolbar />);
    expect(screen.getByTestId("auth-panel")).toBeInTheDocument();
  });

  it("links have correct href", () => {
    render(<Toolbar />);
    expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Logbook").closest("a")).toHaveAttribute("href", "/logbook");
    expect(screen.getByText("Profile").closest("a")).toHaveAttribute("href", "/profile");
  });
});
