import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('todosAccess')

const XAWS = AWSXRay.captureAWS(AWS)

const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly s3 = createS3Client()) {
    }

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todos related to user')

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return result.Items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        todo = {
            ...todo,
            attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todo.todoId}`
        }

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo
    }

    async todoExists(userId: string, todoId: string): Promise<Boolean> {
        const result = await this.docClient
            .get({
                TableName: this.todosTable,
                Key: {
                    userId: userId,
                    todoId: todoId
                }
            }).promise()

        logger.info('Get todo: ', result)
        return !!result.Item
    }

    async getAttachementUploadUrl(todoId: string): Promise<string> {
        return this.s3.getSignedUrl('putObject', {
            Bucket: bucketName,
            Key: todoId,
            Expires: urlExpiration
        })
    }

    async deleteTodo(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        }).promise()

        logger.info('deleted todo: ', todoId)
    }

    async updateTodo(todoUpdate: TodoUpdate, userId: string, todoId: string) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'SET name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
              ':name' : todoUpdate.name,
              ':dueDate' : todoUpdate.dueDate,
              ':done' : todoUpdate.done
            }
        }).promise()
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}

function createS3Client() {
    if (process.env.IS_OFFLINE) {
        logger.info('local')
    }

    return new XAWS.S3({
        signatureVersion: 'v4'
    })
}