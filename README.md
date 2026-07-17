# AI Email & Content Generator

A modern, responsive full-stack web application that leverages the Gemini API to generate professional emails, blog introductions, social media posts, and custom content. Features a beautiful UI with a dark mode toggle and real-time streaming of AI responses.

## Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

## Installation

1. Clone or download this repository.
2. Navigate to the project directory:
   ```bash
   cd ai-content-generator
   ```
3. Install the backend dependencies:
   ```bash
   cd backend
   npm install
   ```

## Environment Variables

1. Navigate to the `backend` directory.
2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your Gemini API key:
   ```
   PORT=3000
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Running Locally

1. From the project root, start the backend server (which also serves the frontend):
   ```bash
   cd backend
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`.

## Docker Commands

To build and run the application using Docker:

1. Build the Docker image:
   ```bash
   docker build -t ai-content-generator .
   ```
2. Run the container (remember to pass your API key):
   ```bash
   docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key_here" ai-content-generator
   ```
3. Access the app at `http://localhost:3000`.

## AWS Deployment Instructions

### Option 1: AWS App Runner (Recommended for containers)

1. Push your Docker image to Amazon ECR (Elastic Container Registry) or connect your GitHub repository directly to App Runner.
2. In the AWS Console, go to **App Runner** -> **Create service**.
3. Select your image from ECR (or GitHub repo).
4. In the service settings:
   - Set Port to `3000`
   - Under Environment variables, add `GEMINI_API_KEY` with your API key.
5. Review and create the service. App Runner will automatically provision HTTPS endpoints.

### Option 2: AWS Elastic Beanstalk (Node.js Environment)

1. Install the EB CLI or use the AWS Console.
2. Prepare your bundle: Zip the entire project folder (ensure `.env` and `node_modules` are excluded).
3. In Elastic Beanstalk, create a new Web server environment.
4. Platform: Select **Node.js**.
5. Application code: Upload your zip file.
6. Before creating the environment, click **Configure more options**.
7. Under **Software** -> **Environment properties**, add `GEMINI_API_KEY` with your actual key.
8. Create environment. Beanstalk will provision a load balancer, EC2 instances, and automatically serve over HTTP (you can configure HTTPS via ACM in the load balancer settings).

## Project Structure

```
ai-content-generator/
├── frontend/             # HTML, CSS, JS
├── backend/              # Node.js/Express server
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers (Gemini integration)
│   ├── package.json      # Dependencies
│   └── .env.example      # Example environment config
├── Dockerfile            # Docker configuration
├── .dockerignore         # Docker ignore rules
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```
