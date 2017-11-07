import { DocumentNode, GraphQLResolveInfo, OperationDefinitionNode, parse, FieldNode } from 'graphql'
import { MergeInfo } from 'graphql-tools/dist/stitching/mergeSchemas';

/*
mergeInfo.delegate only allows you to pass in an operationName and variables.
It does not allow you to define query fields, because they are inferred from the user query.
If you need to delegate a query that is unrelated to the user query, you need to provide
the fields you need. This helper does that, based on a provided query.
 */
export const delegateHelper = (mergeInfo: MergeInfo) => ({
    delegateQuery: async (
        query: string, 
        args: { [key: string]: any }, 
        context: { [key: string]: any }, 
        info: GraphQLResolveInfo): Promise<any> => {
            const document: DocumentNode = parse(query)

            const operationDefinition: OperationDefinitionNode = document.definitions[0] as OperationDefinitionNode
            const operationType: "query" | "mutation" = operationDefinition.operation
            const operationName:string = (operationDefinition.selectionSet.selections[0] as any).name.value
            const fields: [FieldNode] = (operationDefinition.selectionSet.selections[0] as any).selectionSet.selections

            const newInfo: GraphQLResolveInfo = JSON.parse(JSON.stringify(info));
            newInfo.fieldNodes[0].selectionSet!.selections = fields

            return await mergeInfo.delegate(
                operationType, operationName, args, context, newInfo
            )
        }
})

export const addTypeNameField: GraphQLResolveInfo = (info: GraphQLResolveInfo) => {
    const field: FieldNode = 
        { kind: 'Field', name: { kind: 'Name', value: '__typename' } }

    return addFields(info, [field])
}

export const addFields: GraphQLResolveInfo = (info: GraphQLResolveInfo, fields: [FieldNode | string]) => {
    const newInfo = JSON.parse(JSON.stringify(info));

    for (const field of fields) {
        if (typeof field === 'string'){
            newInfo.fieldNodes[0].selectionSet.selections.push({
                kind: 'Field', name: { kind: 'Name', value: field }
            })
        }
        else {
            newInfo.fieldNodes[0].selectionSet.selections.push(field)
        }
    }

    return newInfo
}
