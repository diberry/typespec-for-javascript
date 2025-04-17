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
