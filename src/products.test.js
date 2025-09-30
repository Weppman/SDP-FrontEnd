// ProductsPage.test.js
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ProductsPage from "./products";

describe("ProductsPage Component", () => {
  test("renders all product blocks", () => {
    render(<ProductsPage />);
    
    const electronics = screen.getByText(/Electronics/i);
    const clothing = screen.getByText(/Clothing/i);
    const appliances = screen.getByText(/Home Appliances/i);
    const books = screen.getByText(/Books/i);

    expect(electronics).toBeInTheDocument();
    expect(clothing).toBeInTheDocument();
    expect(appliances).toBeInTheDocument();
    expect(books).toBeInTheDocument();
  });

  test("displays bottom section when 'Learn More' is clicked", () => {
    render(<ProductsPage />);

    const learnMoreButton = screen.getAllByText(/Learn More/i)[0];
    fireEvent.click(learnMoreButton);

    const bottomSection = screen.getByText(/Explore cutting-edge electronics/i)
      .closest("div");

    const brandsHeading = within(bottomSection).getByText(/Electronics\s+Brands/i);
    const description = within(bottomSection).getByText(
      /Explore cutting-edge electronics from leading brands/i
    );

    expect(brandsHeading).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  test("displays correct brand logos for selected block", () => {
    render(<ProductsPage />);
    
    const learnMoreButton = screen.getByText(/Clothing/i).parentNode.querySelector("button");
    fireEvent.click(learnMoreButton);

    const nikeLogo = screen.getByAltText("Nike");
    const adidasLogo = screen.getByAltText("Adidas");

    expect(nikeLogo).toBeInTheDocument();
    expect(adidasLogo).toBeInTheDocument();
  });

  test("closes bottom section when 'Close' button is clicked", () => {
    render(<ProductsPage />);
    
    const learnMoreButton = screen.getAllByText(/Learn More/i)[0];
    fireEvent.click(learnMoreButton);

    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);

    expect(screen.queryByText(/Brands/i)).not.toBeInTheDocument();
  });

  test("does not show bottom section initially", () => {
    render(<ProductsPage />);
    
    expect(screen.queryByText(/Brands/i)).not.toBeInTheDocument();
  });
});
