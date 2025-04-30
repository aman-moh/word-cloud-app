# Word Cloud App

This is a Next.js application designed to generate word clouds from text data, uploaded via CSV files.

## Technologies Used

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Library:** React
*   **Testing:** Jest, React Testing Library
*   **CSV Parsing:** PapaParse

## Getting Started

### Prerequisites

*   Node.js (Version specified in `.nvmrc` or project requirements)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd word-cloud-app
    ```
3.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running in Production Mode

```bash
npm run start
# or
yarn start
```

## Features

*   Generate word clouds from input text data.
*   (Likely) Upload data via CSV files.
*   Admin interface for managing data/uploads.

## Testing

Run the test suite using:

```bash
npm test
# or
yarn test
```

To run tests in watch mode:

```bash
npm run test:watch
# or
yarn test:watch
```

## Contributing

Contributions are welcome! Please follow standard Git workflow (fork, branch, pull request). Ensure tests pass before submitting PRs.