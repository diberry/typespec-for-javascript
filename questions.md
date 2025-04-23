# TypeSpec with JavaScript 

## Questions

### Model

How did they choose which methods to add to the service
Why is a collection a linked list instead of just an array - can I change that?

### JS

* why doesn't JS server have a package.json
* how am I supposed to get the npm packages to add to package.json
* how do I create the WidgetService - https://www.npmjs.com/package/@typespec/http-server-js
* why aren't all the types exported from the service interface

### .NET

* How does it ingrate with existing project
* How is middleware managed
* Which version of .NET is supported
* server doesn't have project file
* client has project and solution file

## Document flow (focus on Azure services and their SDK integration instead of Azure hosting)

### Developer creates/owns

* Environment files such as package.json
* Server framework file - the thing that listens to ports and manages routes
* Build and start steps
* Azure integration
* Swagger UI
* Frontend client 

### TSP creates/owns

* API server middleware
* API server services and models used by middleward
* CLIENT sdk used by frontend to call api middleware

### Separation of concerns

* API design in tsp file
* generate server and client

### Update api server code

* include server generated code into parent api server in a repeatable way
* extend server's api service with integration to Azure services
    * canned sdk code to Azure SDK's for data management
* build and verify api server works

### Update api client code to call server apis

* TBD - 
