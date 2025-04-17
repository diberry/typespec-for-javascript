import { createWidgetServiceRouter } from "../generated/server/src/generated/http/router.js";
import MyWidgetService from "./widgetService.js";

import express from "express";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const thisWidgetService = new MyWidgetService();
const router = createWidgetServiceRouter(thisWidgetService);
const app = express();

const swaggerSpecPath = path.resolve(__dirname, '../../generated/spec/openapi3/openapi.yaml');

console.log(`Loading swagger spec from ${swaggerSpecPath}`);
const swaggerSpec = await fs.readFile(swaggerSpecPath, 'utf8');
const swaggerDocument = YAML.parse(swaggerSpec)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(router.expressMiddleware);

app.listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});