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
    return { code: 200, message: "Not implemented" };
  }
}