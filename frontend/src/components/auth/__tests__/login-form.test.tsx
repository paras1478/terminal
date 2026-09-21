import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { loginAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";

jest.mock("@/lib/auth/actions", () => ({
  loginAction: jest.fn(),
}));

const mockedLoginAction = loginAction as jest.MockedFunction<
  typeof loginAction
>;

describe("LoginForm", () => {
  beforeEach(() => {
    mockedLoginAction.mockReset();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i }),
    ).toBeInTheDocument();
  });

  it("submits entered credentials to loginAction", async () => {
    const user = userEvent.setup();
    mockedLoginAction.mockResolvedValue(initialAuthFormState);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockedLoginAction).toHaveBeenCalledTimes(1));

    const formData = mockedLoginAction.mock.calls[0][1];
    expect(formData.get("email")).toBe("jane@example.com");
    expect(formData.get("password")).toBe("StrongP@ss1");
  });

  it("shows a top-level error message returned by the action", async () => {
    const user = userEvent.setup();
    mockedLoginAction.mockResolvedValue({
      error: "Invalid email or password",
      fieldErrors: {},
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
  });

  it("shows field-level validation errors returned by the action", async () => {
    const user = userEvent.setup();
    mockedLoginAction.mockResolvedValue({
      error: null,
      fieldErrors: { email: ["Enter a valid email address"] },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("links to the register page", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
