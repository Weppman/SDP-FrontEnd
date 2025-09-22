import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import ViewProfileButton from "./viewProfile";

describe("ViewProfileButton", () => {
  test("renders without crashing and displays correct text", () => {
    // Render the component inside a Router
    render(
      <Router>
        <ViewProfileButton userID={42} />
      </Router>,
    );

    // Check that the link text is rendered
    const linkElement = screen.getByText("View Profile");
    expect(linkElement).toBeInTheDocument();

    // Check that the link has the correct href
    expect(linkElement.closest("a")).toHaveAttribute("href", "/profile/42");
  });

  test("applies the correct CSS classes", () => {
    render(
      <Router>
        <ViewProfileButton userID={5} />
      </Router>,
    );

    const linkElement = screen.getByText("View Profile");
    expect(linkElement).toHaveClass(
      "rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100",
    );
  });

  test("renders without crashing for any userID", () => {
    // Minimal smoke test to hit the `return (` line
    render(
      <Router>
        <ViewProfileButton userID={999} />
      </Router>,
    );
  });
});
