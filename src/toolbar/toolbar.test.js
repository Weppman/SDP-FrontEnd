import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Toolbar from "./toolbar";

// Mock everything that's causing issues
jest.mock("../context/userContext", () => ({
  useUserContext: () => ({
    userID: "123",
    authID: "auth_123",
    biography: "Hello",
    status: "user",
  }),
}));

jest.mock("../authHandling/authPanel", () => {
  return function MockAuthPanel() {
    return <div>Auth Panel</div>;
  };
});

jest.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ getToken: jest.fn() }),
  SignedIn: ({ children }) => <div>{children}</div>,
  SignedOut: ({ children }) => <div>{children}</div>,
  SignInButton: ({ children }) => <div>{children}</div>,
  SignUpButton: ({ children }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
}));

describe("Toolbar", () => {
  it("FE_NAV_001 renders navigation links for a logged-in user", () => {
    render(
      <BrowserRouter>
        <Toolbar />
      </BrowserRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Plan Hike")).toBeInTheDocument();
    expect(screen.getByText("Logbook")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });
});