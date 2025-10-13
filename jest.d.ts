import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveValue(value: string | string[] | number): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveDescription(text?: string | RegExp): R
      toHaveAccessibleDescription(text?: string | RegExp): R
      toHaveAccessibleName(text?: string | RegExp): R
      toHaveRole(role: string, options?: { hidden?: boolean }): R
      toHaveFocus(): R
      toBeRequired(): R
      toBeInvalid(): R
      toBeValid(): R
      toHaveErrorMessage(text?: string | RegExp): R
    }
  }
}
