import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { RequireAuthFixture } from "./RequireAuth.fixture";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const authState = {
  user: null as { id: string } | null,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock("@/core/presentation/hooks/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
  }),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("RequireAuth", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
  });

  it("redirects to /login when there is no authenticated user", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route element={<RequireAuthFixture />}>
            <Route path="/home" element={<div>Home</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("shows protected content when authenticated", () => {
    authState.user = { id: "1" };
    authState.isAuthenticated = true;

    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route element={<RequireAuthFixture />}>
            <Route path="/home" element={<div>Home</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/home");
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("shows loading during initial bootstrap without user", () => {
    authState.isLoading = true;

    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route element={<RequireAuthFixture />}>
            <Route path="/home" element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
