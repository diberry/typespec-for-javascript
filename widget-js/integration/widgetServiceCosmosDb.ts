import { CosmosClient, Container, ErrorResponse } from '@azure/cosmos';
import type { Widget, WidgetServiceError, WidgetService } from '../generated/server/src/generated/models/all/widget-service.js';
import type { WidgetUpdate, ResourceDeletedResponse, WidgetCreate, WidgetCollectionWithNextLink } from '../generated/server/src/generated/models/all/typespec/rest/resource.js';

export default class MyWidgetServiceCosmosDb implements WidgetService {
  private client: CosmosClient;
  private container: Container;

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
      const { resource } = await this.container.item(id, id).read();
      if (!resource) {
        return { code: 404, message: 'Widget not found' };
      }
      return resource as Widget;
    } catch (error) {
      const cosmosError = error as ErrorResponse;
      return { code: 500, message: `Error retrieving widget: ${cosmosError.message || 'Unknown error'}` };
    }
  }

  async update(ctx: unknown, id: string, properties: WidgetUpdate): Promise<Widget | WidgetServiceError> {
    try {
      const { resource } = await this.container.item(id, id).read();
      if (!resource) {
        return { code: 404, message: 'Widget not found' };
      }
      const updatedWidget = { ...resource, ...properties };
      const { resource: updated } = await this.container.item(id, id).replace(updatedWidget);
      return updated as Widget;
    } catch (error) {
      const cosmosError = error as ErrorResponse;
      return { code: 500, message: `Error updating widget: ${cosmosError.message || 'Unknown error'}` };
    }
  }

  async delete(ctx: unknown, id: string): Promise<ResourceDeletedResponse | WidgetServiceError> {
    try {
      await this.container.item(id, id).delete();
      return { status: 'deleted', id };
    } catch (error) {
      const cosmosError = error as ErrorResponse;
      return { code: 500, message: `Error deleting widget: ${cosmosError.message || 'Unknown error'}` };
    }
  }

  async create(ctx: unknown, resource: WidgetCreate): Promise<Widget> {
    try {
      const newWidget: Widget = {
        id: Date.now().toString(), // Generate a unique ID
        ...resource,
      };
      
      const { resource: created } = await this.container.items.create(newWidget);
      return created as Widget;
    } catch (error) {
      const cosmosError = error as ErrorResponse;
      throw new Error(`Failed to create widget: ${cosmosError.message || 'Unknown error'}`);
    }
  }

  async list(ctx: unknown): Promise<WidgetCollectionWithNextLink | WidgetServiceError> {
    try {
      const querySpec = {
        query: "SELECT * FROM c"
      };
      
      const { resources } = await this.container.items.query<Widget>(querySpec).fetchAll();
      return {
        value: resources,
        nextLink: undefined,
      };
    } catch (error) {
      const cosmosError = error as ErrorResponse;
      return { code: 500, message: `Error listing widgets: ${cosmosError.message || 'Unknown error'}` };
    }
  }
}