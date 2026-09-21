import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";
import { registerAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";

jest.mock("@/lib/auth/actions", () => ({
  registerAction: jest.fn(),
}));

const mockedRegisterAction = registerAction as jest.MockedFunction<
  typeof registerAction
>;

describe("RegisterForm", () => {
  beforeEach(() => {
    mockedRegisterAction.mockReset();
  });

  it("renders all expected fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("submits form values to registerAction", async () => {
    const user = userEvent.setup();
    mockedRegisterAction.mockResolvedValue(initialAuthFormState);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "StrongP@ss1");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "StrongP@ss1",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockedRegisterAction).toHaveBeenCalledTimes(1),
    );

    const formData = mockedRegisterAction.mock.calls[0][1];
    expect(formData.get("email")).toBe("jane@example.com");
    expect(formData.get("firstName")).toBe("Jane");
  });

  it("shows a top-level error message returned by the action", async () => {
    const user = userEvent.setup();
    mockedRegisterAction.mockResolvedValue({
      error: "An account with this email already exists",
      fieldErrors: {},
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "StrongP@ss1");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "StrongP@ss1",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("An account with this email already exists"),
    ).toBeInTheDocument();
  });

  it("shows field-level validation errors returned by the action", async () => {
    const user = userEvent.setup();
    mockedRegisterAction.mockResolvedValue({
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "StrongP@ss1");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "Mismatch1!",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
  });

  it("links to the login page", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
