import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getAttachmentUploadUrl, todoExists } from '../../businessLogic/todos'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const validTodo = await todoExists(jwtToken, todoId)

  // check, if Todo exists
  if (!validTodo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo does not exist'
      })
    }
  }

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  const uploadUrl = await getAttachmentUploadUrl(jwtToken, todoId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl: uploadUrl
    })
  }
}
