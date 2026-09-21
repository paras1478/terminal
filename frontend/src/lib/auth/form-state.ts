export interface AuthFormState {
  error: string | null;
  fieldErrors: Record<string, string[]>;
}

export const initialAuthFormState: AuthFormState = {
  error: null,
  fieldErrors: {},
};
