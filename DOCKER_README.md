# ComplianceOS Docker Setup

This guide explains how to run ComplianceOS using Docker. This setup allows you to run the full application (Frontend + Backend + Database) with a single command.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- A [Supabase](https://supabase.com/) project (for Authentication).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ComplianceOS.git
    cd ComplianceOS
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory with your Supabase credentials. You can copy the example below:

    ```bash
    # .env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ```
    > **Note:** Without valid Supabase credentials, you will not be able to log in.

3.  **Run the Application:**
    Run the following command to build and start the containers:
    ```bash
    docker-compose up --build
    ```

    - The first run will take a few minutes to build the application and download dependencies.
    - Database migrations will run automatically on startup.

4.  **Access the App:**
    Open your browser and navigate to:
    [http://localhost:3001](http://localhost:3001)

## How to Update

To update the application to the latest version:

1.  Pull the latest changes from git:
    ```bash
    git pull origin main
    ```

2.  Rebuild and restart the containers:
    ```bash
    docker-compose up --build -d
    ```
    The `--build` flag ensures that the Docker image is rebuilt with the new code.

## Troubleshooting

-   **Database Connection Errors:** Ensure the `db` container is running. You can check with `docker-compose ps`.
-   **Login Failed:** Check the container logs (`docker-compose logs -f app`) to see if there are Supabase authentication errors. Verify your keys in the `.env` file.
-   **Port Conflicts:** If port 3001 or 5432 is already in use, modify the `ports` mapping in `docker-compose.yml`.

## Architecture

-   **App Container:** Runs the Node.js backend. In production mode, it also serves the compiled frontend assets (Vite build), providing a unified experience on port 3001.
-   **DB Container:** Runs PostgreSQL 15. Data is persisted in a Docker volume `db_data`.
