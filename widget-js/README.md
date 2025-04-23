# TypeSpec Widget API

This is a RESTful JavaScript API application built using TypeSpec.

## Development

### Prerequisites

- Node.js LTS
- TypeSpec compiler: `npm install -g @typespec/compiler`

### Getting Started

1. Install dependencies:

```bash
npm install
```

2. Build and run the application in development mode:

```bash
npm run dev
```

3. Access the API at http://localhost:8080 and Swagger UI at http://localhost:8080/api-docs

## Docker Build

This project uses a two-stage Docker build process for optimized container images:

1. **Build stage**: Compiles TypeScript and generates TypeSpec code
2. **Production stage**: Contains only the minimal files needed to run the application

### Building the Docker Image

```bash
docker build -t widget-api .
```

### Running the Docker Container

```bash
docker run -p 8080:8080 -e COSMOS_DB_ENDPOINT=your_cosmos_endpoint -e COSMOS_DB_KEY=your_cosmos_key widget-api
```

## Environment Variables

- `PORT`: The port to run the server on (default: 8080)
- `COSMOS_DB_ENDPOINT`: Endpoint URL for Azure Cosmos DB
- `COSMOS_DB_KEY`: Access key for Azure Cosmos DB
- `COSMOS_DB_DATABASE_ID`: Database ID (default: 'WidgetsDb')
- `COSMOS_DB_CONTAINER_ID`: Container ID (default: 'Widgets')
- `COSMOS_DB_PREFERRED_REGION`: Preferred Azure region for Cosmos DB (optional)

## Project Structure

- `dist/`: Compiled JavaScript files
- `generated/`: Auto-generated TypeSpec code
- `integration/`: Implementation of service interfaces
- `server/`: Express server setup
- `spec/`: TypeSpec API definitions

## Production Deployment

For production deployment, the Docker image only contains:

1. Compiled JavaScript code (`dist/`)
2. Generated TypeSpec files (`generated/`)
3. Package metadata (`package.json`)
4. Production dependencies

This results in a smaller, more secure container for deployment.