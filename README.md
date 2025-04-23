# Design and implement an API application with TypeSpec

This tutorial demonstrates how to use TypeSpec to design and implement a RESTful JavaScript API application. TypeSpec is an open-source language for describing cloud service APIs and generates client and server code for multiple platforms. By following this tutorial, you'll learn how to define your API contract once and generate consistent implementations, helping you build more maintainable and well-documented API services.

In this tutorial, you:

> [!div class="checklist"]
> * Create a TypeScript API server application
> * Define your API using TypeSpec
> * Generate API code from TypeSpec definitions
> * Implement service functionality with in-memory storage
> * Integrate with Azure Cosmos DB for persistent storage
> * Run and test your API locally

## Prerequisites

* An active Azure account. [Create an account for free](https://azure.microsoft.com/free) if you don't have one.
* [Node.js LTS](https://nodejs.org/) installed on your system.
* [TypeScript](https://www.typescriptlang.org/) for writing and compiling TypeScript code.
* [TypeSpec compiler](https://www.npmjs.com/package/@typespec/compiler) installed globally:
  ```bash
  npm install -g @typespec/compiler
  ```
* [Visual Studio Code](https://code.visualstudio.com/) with the [TypeSpec extension](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode)
* [Azure Cosmos DB account](https://learn.microsoft.com/azure/cosmos-db/sql/create-cosmosdb-resources-portal) (for database integration)

## Application structure with TypeSpec

TypeSpec helps you define your API in a language-agnostic way and generate server and client code for multiple platforms. This allows you to:

* Define your API contract once
* Generate consistent server and client code
* Focus on implementing business logic rather than API infrastructure

### Where does TypeSpec fit in API development flow

#### What TypeSpec provides (auto-generated)

* OpenAPI definitions for your API
* Server-side middleware and routing code
* Client SDKs for consuming your API
* Type definitions for requests and responses

#### What you're responsible for

* Implementing service interfaces with business logic
* Integrating with data stores (like Azure Cosmos DB)
* Setting up build and deployment processes
* Hosting your API (locally or in Azure)

## Start a TypeScript API application

First, let's set up a basic TypeScript project:

1. Create a project directory and initialize your package.json:

```bash
mkdir widget-api
cd widget-api
npm init -y
```

2. Install required dependencies:

```bash
npm install express swagger-ui-express yaml
npm install --save-dev typescript @types/express @types/node @types/swagger-ui-express
```

3. Create a basic `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "outDir": "dist",
    "strict": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Create a TypeSpec project

Now, let's define our API with TypeSpec:

1. Create a spec directory and add the required files:

  ```bash
  mkdir -p spec
  ```

2. Create a `spec/main.tsp` file to define your API:

  ```tsp
  import "@typespec/http";
  import "@typespec/rest";

  @service(#{
    title: "Widget Service",
  })
  namespace WidgetService;

  using TypeSpec.Http;
  using TypeSpec.Rest;

  model Widget {
    @key id: string;
    weight: int32;
    color: "red" | "blue";
  }

  @error
  model WidgetServiceError {
    @statusCode
    @minValue(400)
    @maxValue(599)
    code: int32;

    message: string;
  }

  interface WidgetService extends Resource.ResourceOperations<Widget, WidgetServiceError> {}
  ```

3. Create a `spec/tspconfig.yaml` file to configure code generation for the OpenAPI spec, the client library and the API server library:

  ```yaml
  emit:
  - "@typespec/openapi3"
  - "@typespec/http-client-js"
  - "@typespec/http-server-js" 
  options:
    "@typespec/openapi3":
      emitter-output-dir: "{project-root}/generated/spec/openapi3"
    "@typespec/http-client-js":
      emitter-output-dir: "{project-root}/generated/client"
      package-name: "@typespec/widget-client"
    "@typespec/http-server-js":
      emitter-output-dir: "{project-root}/generated/server"
      express: true
      omit-unreachable-types: true
  ```

## Generate spec, server, and client

1. Add a script entry to your `package.json` to compile the TypeSpec definitions:

  ```json
  "build:tsp": "tsp compile ./spec --config ./spec/tspconfig.yaml"
  ```

2. Run the build script to generate your code:

  ```bash
  npm run build:tsp
  ```

  This will create:
  - OpenAPI specifications in `generated/spec/openapi3/openapi.yaml`
  - API server routes (also known as middleware) in `generated/server/`. The key integration file is `generated/server/src/generated/http/router.ts`.
  - Client library, to call API server routes, in `generated/client/`. The key integration file is `/generated/client/src/widgetServiceClient.ts`.

## Create API server

Create a basic Express.js JavaScript API server. 

1. Create a `server` directory for your application code:

    ```bash
    mkdir -p server
    ```
    
1. Create the `./server/server.ts` file for the API server:

    ```typescript  
    import express from "express";
    import swaggerUi from 'swagger-ui-express';
    import YAML from 'yaml';
    import path from 'path';
    import { promises as fs } from 'fs';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const app = express();
    
    // Add generated OPENAPI spec
    const swaggerSpecPath = path.resolve(__dirname, 'FILE-NAME');
    
    console.log(`Loading swagger spec from ${swaggerSpecPath}`);
    const swaggerSpec = await fs.readFile(swaggerSpecPath, 'utf8');
    const swaggerDocument = YAML.parse(swaggerSpec)
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    
    // Add generated route
    const thisWidgetService = new MyWidgetService();
    const router = createWidgetServiceRouter(thisWidgetService);
    app.use(ROUTE-METHOD);
    
    app.listen(8080, () => {
      console.log("Server listening on http://localhost:8080");
    });
    ```

1. Replace `FILE-NAME` with the generated OpenAPI spec file found at `/generated/spec/openapi3`.
1. Replace `ROUTE-METHOD` with the generated route for the API found at `/generated/server/src/generated/http/router.js`. The method name is `createWidgetServiceRouter`. The entire change is:

    ```typescript
    app.use(router.expressMiddleware);
    ```

## Integrate generated code into API application

The generated server route provides an interface but not the actual business logic to fill in the methods of the interface. You need to create the implementation for that interface. This implementation creates an in-memory data store for CRUD operations associated with the REST specification.

1. Create `server/widgetService.ts` to implement the service interface:

  ```typescript
  import type { Widget, WidgetServiceError, WidgetService } from '../generated/server/src/generated/models/all/widget-service.js';
  import type { WidgetUpdate, ResourceDeletedResponse, WidgetCreate, WidgetCollectionWithNextLink } from '../generated/server/src/generated/models/all/typespec/rest/resource.js';

  export default class MyWidgetService implements WidgetService {
    private widgets: Widget[] = [];

    async get(ctx: unknown, id: string): Promise<Widget | WidgetServiceError> {
      const widget = this.widgets.find((w) => w.id === id);
      if (!widget) {
        return { code: 404, message: 'Widget not found' };
      }
      return widget;
    }

    async update(ctx: unknown, id: string, properties: WidgetUpdate): Promise<Widget | WidgetServiceError> {
      const widgetIndex = this.widgets.findIndex((w) => w.id === id);
      if (widgetIndex === -1) {
        return { code: 404, message: 'Widget not found' };
      }
      this.widgets[widgetIndex] = { ...this.widgets[widgetIndex], ...properties };
      return this.widgets[widgetIndex];
    }

    async delete(ctx: unknown, id: string): Promise<ResourceDeletedResponse | WidgetServiceError> {
      const widgetIndex = this.widgets.findIndex((w) => w.id === id);
      if (widgetIndex === -1) {
        return { code: 404, message: 'Widget not found' };
      }
      this.widgets.splice(widgetIndex, 1);
      return { status: 'deleted', id };
    }

    async create(ctx: unknown, resource: WidgetCreate): Promise<Widget> {
      const newWidget: Widget = {
        id: (this.widgets.length + 1).toString(),
        ...resource,
      };
      this.widgets.push(newWidget);
      return newWidget;
    }

    async list(ctx: unknown): Promise<WidgetCollectionWithNextLink | WidgetServiceError> {
      return {
        items: this.widgets,
        nextLink: null
      };
    }
  }
  ```

## Integrate Azure database service into API application

Now, let's modify our service to use Azure Cosmos DB for persistent storage:

1. Install the Cosmos DB SDK:

  ```bash
  npm install @azure/cosmos
  ```

2. Create `server/widgetServiceCosmosDb.ts`:

  ```typescript
  import { CosmosClient } from '@azure/cosmos';
  import type { Widget, WidgetServiceError, WidgetService } from '../generated/server/src/generated/models/all/widget-service.js';
  import type { WidgetUpdate, ResourceDeletedResponse, WidgetCreate, WidgetCollectionWithNextLink } from '../generated/server/src/generated/models/all/typespec/rest/resource.js';

  export default class MyWidgetServiceCosmosDb implements WidgetService {
    private client: CosmosClient;
    private container: any;

    constructor() {
      const endpoint = process.env.COSMOS_DB_ENDPOINT || '';
      const key = process.env.COSMOS_DB_KEY || '';
      const databaseId = process.env.COSMOS_DB_DATABASE_ID || 'WidgetsDb';
      const containerId = process.env.COSMOS_DB_CONTAINER_ID || 'Widgets';

      this.client = new CosmosClient({ endpoint, key });
      this.container = this.client.database(databaseId).container(containerId);
    }

    async get(ctx: unknown, id: string): Promise<Widget | WidgetServiceError> {
      try {
        const { resource } = await this.container.item(id).read();
        if (!resource) {
          return { code: 404, message: 'Widget not found' };
        }
        return resource;
      } catch (error) {
        return { code: 500, message: 'Error retrieving widget' };
      }
    }

    async update(ctx: unknown, id: string, properties: WidgetUpdate): Promise<Widget | WidgetServiceError> {
      try {
        const { resource } = await this.container.item(id).read();
        if (!resource) {
          return { code: 404, message: 'Widget not found' };
        }
        const updatedWidget = { ...resource, ...properties };
        const { resource: updated } = await this.container.items.upsert(updatedWidget);
        return updated;
      } catch (error) {
        return { code: 500, message: 'Error updating widget' };
      }
    }

    async delete(ctx: unknown, id: string): Promise<ResourceDeletedResponse | WidgetServiceError> {
      try {
        await this.container.item(id).delete();
        return { status: 'deleted', id };
      } catch (error) {
        return { code: 500, message: 'Error deleting widget' };
      }
    }

    async create(ctx: unknown, resource: WidgetCreate): Promise<Widget> {
      const newWidget: Widget = {
        id: (Date.now().toString()), // Generate a unique ID
        ...resource,
      };
      const { resource: created } = await this.container.items.create(newWidget);
      return created;
    }

    async list(ctx: unknown): Promise<WidgetCollectionWithNextLink | WidgetServiceError> {
      try {
        const { resources } = await this.container.items.readAll<Widget>().fetchAll();
        return {
          items: resources,
          nextLink: null,
        };
      } catch (error) {
        return { code: 500, message: 'Error listing widgets' };
      }
    }
  }
  ```

3. Update your `server/server.ts` to use the Cosmos DB implementation:

  ```typescript
  // In server.ts, change this line:
  import MyWidgetService from "./widgetService.js";

  // To use the Cosmos DB implementation:
  import MyWidgetServiceCosmosDb from "./widgetServiceCosmosDb.js";

  // And update the service instantiation:
  const thisWidgetService = new MyWidgetServiceCosmosDb();
  ```

## Run API application locally

1. Before running, set up the environment variables for Cosmos DB:

  ```bash
  # For Windows
  set COSMOS_DB_ENDPOINT=your_cosmos_db_endpoint
  set COSMOS_DB_KEY=your_cosmos_db_key

  # For macOS/Linux
  export COSMOS_DB_ENDPOINT=your_cosmos_db_endpoint
  export COSMOS_DB_KEY=your_cosmos_db_key
  ```

2. Build and start your application:

  ```bash
  npm run build
  npm start
  ```

3. Your API is now running at http://localhost:8080 with Swagger UI at http://localhost:8080/api-docs

## Deploy application to Azure

You can deploy this application to Azure using Azure Container Apps:

1. Create an Azure Container Registry
2. Build and push your Docker image
3. Deploy to Azure Container Apps using the Azure Developer CLI:

  ```bash
  azd up
  ```

## Use application in browser

Once deployed, you can:

1. Access the Swagger UI to test your API
2. Create, read, update, and delete widgets through the API
3. Use the generated client SDK in another application to consume your API

## Clean up resources

When you're done with this tutorial, you can clean up the Azure resources:

```bash
azd down
```

Or delete the resource group directly from the Azure portal.

## Related articles

- [TypeSpec documentation](https://microsoft.github.io/typespec/)
- [Azure Cosmos DB documentation](https://learn.microsoft.com/azure/cosmos-db/)
- [Deploy Node.js apps to Azure](https://learn.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure Container Apps documentation](https://learn.microsoft.com/azure/container-apps/)


