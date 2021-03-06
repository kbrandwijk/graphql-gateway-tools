## UPDATE: `graphql-gateway-tools` has been abandoned in favor of my new GraphQL Application Framework: [Qewl](https://github.com/kbrandwijk/qewl)








# graphql-gateway-tools

A set of tools to help you build a GraphQL Gateway using remote schemas and schema stitching.

[![https://nodei.co/npm/graphql-gateway-tools.png?downloads=false&downloadRank=true&stars=true](https://nodei.co/npm/graphql-gateway-tools.png?downloads=false&downloadRank=true&stars=true)](https://www.npmjs.com/package/graphql-gateway-tools)

## SchemaGenerator

A higher order helper for creating a merged schema. It makes it easy to compose a schema, by providing methods to add remote schema endpoints, local GraphQL schemas, partial type definitions, and multiple resolver functions.

```ts
const schemaGenerator = new SchemaGenerator()

// Create a remoteExecutableSchema by specifying the endpoint address
await schemaGenerator.registerEndpoint({uri: 'http://myendpointaddress/graphql'})

// Create a remoteExecutableSchema by specifying endpoint adddress and introspection schema:
await schemaGenerator.registerEndpoint({uri: 'http://myendpointaddress/graphql', introspectionSchema: myIntrospectionSchema})

// Create a remoteExecutableSchema by passing in an ApolloLink instance
await schemaGenerator.registerEndpoint({link: myApolloLink})

// Create a remoteExecutableSchema that uses an Authorization bearer token
await schemaGenerator.registerEndpoint({uri: 'http://myendpointaddress/graphql', authenticationToken: 'ey.......'})

// Add a schema 
schemaGenerator.registerSchema(schema: myGraphQLSchema)

// Add a type definition
schemaGenerator.registerTypeDefinition(typeDefs: myTypeDefinitionString)
    
// Add a resolver function
schemaGenerator.registerResolver(resolverFunction: myResolverFunction)

// Generate the merged schema
const mySchema = schemaGenerator.generateSchema()
```

See the [examples](./examples) folder for a complete example (coming soon).

## addTypeNameField

If you add an Interface Types to your merged schema, you have to manually add the `__typeName` field to your resolvers. This helper function makes it easy to do so.

```ts
// Assuming you have created a remote schema mySchema with types Car and Boat

const schemaGenerator = new SchemaGenerator()
schemaGenerator.registerEndpoint({uri: '...' })

const typeDefs = `
    interface Verhicle {
        maxSpeed: Float
    }

    extend type Car implements Vehicle { }

    extend type Boat implements Vehicle { }
    
    extend type Query {
        allVehicles: [Verhicle]
    }`

const allVehiclesresolver = mergeInfo => ({
    Query: {
        allVehicles: {
            async resolve(parent, args, context, info){
                const newInfo = addTypeNameField(info)

                const cars = mergeInfo.delegate('query', 'allCars', args, context, info)
                const boats = mergeInfo.delgate('query', 'allBoats', args, context, info)

                return [...cars, ...boats]
            }
        }
    }
})

schemaGenerator.registerTypeDefinition(typeDefs)
schemaGenerator.registerResolver(allVehiclesresolver)

const mergedSchema = schemaGenerator.generateSchema()
```

## addFields(mergeInfo: MergeInfo, fields: Array<FieldNode | string>)

A generic helper for adding fields to the resolveInfo, by passing in a fieldName, or a complete FieldNode.

```ts
// Inside a resolver
const myField: FieldNode = { kind: 'Field', name: { kind: 'Name', value: 'myField' } }
const anotherField: 'anotherField'

addFields(mergeInfo, [myField, anotherField])
```
