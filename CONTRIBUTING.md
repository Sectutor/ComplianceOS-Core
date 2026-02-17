# Contributing to GRCompliance

Thank you for your interest in contributing to GRCompliance! We welcome contributions from the community to help make GRC tools accessible to everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## Development Workflow

### Project Structure
This is a monorepo managed with npm workspaces:
- `packages/core`: The main open-source application logic.
- `packages/ui`: Shared UI components (shadcn/ui).

**Note:** Premium features are not included in the open-source repository. The build system automatically mocks these components.

### Running Locally
To start the development server:
```bash
npm run dev
```

To start the backend (TRPC) server:
```bash
npm run server
```

## Pull Request Guidelines

1.  **Scope**: Keep PRs focused on a single feature or fix.
2.  **Tests**: Ensure your changes don't break existing functionality. Run `npm test` before submitting.
3.  **Style**: Follow the existing code style. We use ESLint and Prettier.
4.  **Description**: Provide a clear description of what your PR does and why.

## Code of Conduct

Please be respectful and professional in all interactions. We are committed to providing a friendly, safe, and welcoming environment for all.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
