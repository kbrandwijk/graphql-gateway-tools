import { createHttpLink } from 'apollo-link-http'
import { ApolloLink } from 'apollo-link'
import fetch from 'node-fetch'
import { GraphQLSchema } from 'graphql'
import { introspectSchema, makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools'
import { MergeInfo } from 'graphql-tools/dist/stitching/mergeSchemas'
import { IResolvers } from 'graphql-tools/dist/Interfaces'
import { merge } from 'lodash'

export class SchemaGenerator {
    private _schemas: (GraphQLSchema | string)[] = []
    private _resolvers: ((mergeInfo: MergeInfo) => IResolvers)[] = []

    async registerEndpoint({uri, introspectionSchema, link, authenticationToken}: {
        uri?: string, 
        introspectionSchema?: GraphQLSchema, 
        link?: ApolloLink,
        authenticationToken?: (context) => string }): Promise<GraphQLSchema> {
        

        if (link === undefined) {
            const httpLink: ApolloLink = createHttpLink({ uri, fetch })

            if (authenticationToken !== undefined) {
                link = new ApolloLink((operation, forward) => {
                    operation.setContext((context) => {
                        
                        if (context && authenticationToken(context)) {
                            console.log(authenticationToken(context))
                            return {
                                headers: {
                                    'Authorization': `Bearer ${authenticationToken(context)}`,
                                }
                            }
                        }
                        else { 
                            return null
                        }
                    })
                    return forward!(operation);
                }).concat(httpLink)
            }
            else {
                link = httpLink
            }
        }

        if (introspectionSchema === undefined) {
            introspectionSchema = await introspectSchema(link)
        }

        const executableSchema = makeRemoteExecutableSchema({ schema: introspectionSchema, link })
        this._schemas.push(executableSchema)

        return executableSchema
    }

    registerSchema(schema: GraphQLSchema) {
        this._schemas.push(schema)
    }

    registerTypeDefinition(typeDefs: string) {
        this._schemas.push(typeDefs)
    }
    
    registerResolver(resolverFunction: any) {
        this._resolvers.push(resolverFunction)
    }

    generateSchema() {
        const resolvers = mergeInfo => {
            const resolverObject = {}
            merge(resolverObject, ...this._resolvers.map(r => r(mergeInfo)))
            return resolverObject
        }

        const finalSchema = mergeSchemas({
            schemas: this._schemas,
            resolvers
        })
        
        return finalSchema
    }
}