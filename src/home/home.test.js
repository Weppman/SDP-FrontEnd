import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./home";
import axios from "axios";
import { useUserContext } from "../context/userContext";

jest.mock("axios");
jest.mock("../context/userContext");

describe("Home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserContext.mockReturnValue({ userID: "123", status: "user" });
  });

  it("FE_HOME_001 renders activity feed when user is logged in", async () => {
    axios.post.mockResolvedValue({
      data: {
        rows: [
          {
            activityfeedid: 1,
            title: "FeedTest",
            content: "Some content",
            userid: "123",
            dateposted: new Date().toISOString(),
          },
        ],
      },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("FeedTest")).toBeInTheDocument();
      expect(screen.getByText("Some content")).toBeInTheDocument();
    });
  });

  it("FE_HOME_002 submits new post form successfully", async () => {
    axios.post.mockResolvedValue({
      data: { rows: [{ activityfeedid: 2 }] },
    });

    render(<Home />);

    const titleInput = screen.getByPlaceholderText("e.g., Morning Hike");
    const contentInput = screen.getByPlaceholderText("What did you do?");
    const submitButton = screen.getByText("Post");

    fireEvent.change(titleInput, { target: { value: "New Post" } });
    fireEvent.change(contentInput, { target: { value: "Post content" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sql: expect.stringContaining("INSERT INTO activity_feed_table"),
        }),
        expect.any(Object)
      );
    });
  });

  it("FE_HOME_003 renders empty feed message when no posts", async () => {
  axios.post.mockResolvedValue({ data: { rows: [] } });

  render(<Home />);

  await waitFor(() => {
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });
  });

  it("FE_HOME_004 shows visitor message instead of form when not signed in", async () => {
    useUserContext.mockReturnValue({ userID: null, status: "visitor" });

    render(<Home />);

    expect(screen.getByText("Please sign in to add a post.")).toBeInTheDocument();
  });

  it("FE_HOME_005 handles fetchFeed axios error gracefully", async () => {
    axios.post.mockRejectedValue(new Error("Failed to fetch"));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("No activity yet.")).toBeInTheDocument(); // fallback
    });
  });

});
