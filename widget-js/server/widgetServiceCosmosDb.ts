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