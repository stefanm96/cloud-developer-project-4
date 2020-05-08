var AWSXRay = require('aws-xray-sdk');
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('todosAccess')

var AWS = AWSXRay.captureAWS(require('aws-sdk'));

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
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo
    }

    async todoExists(userId: string, todoId: string): Promise<Boolean> {
        logger.info('userId: ', userId)
        logger.info('todoId: ', todoId)
        
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':todoId': todoId
            },
            ScanIndexForward: false
        }).promise()
        
        logger.info('Get todo: ', result)
        return result.Count > 0
    }

    async getAttachementUploadUrl(userId:string, todoId: string): Promise<string> {
        const signedUrl = this.s3.getSignedUrl('putObject', {
            Bucket: bucketName,
            Key: todoId,
            Expires: parseInt(urlExpiration)
        })

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                'userId' : userId,
                'todoId' : todoId
            },
            UpdateExpression: 'SET #attachmentUrl = :attachmentUrl',
            ExpressionAttributeNames: {
                '#attachmentUrl': 'attachmentUrl',
            },
            ExpressionAttributeValues: {
                ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoId}`
            }
        }).promise()

        return signedUrl
    }

    async deleteTodo(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                'userId' : userId,
                'todoId' : todoId
            }
        }).promise()

        logger.info('deleted todo: ', todoId)
    }

    async updateTodo(todoUpdate: TodoUpdate, userId: string, todoId: string) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                'userId' : userId,
                'todoId' : todoId
            },
            UpdateExpression: 'SET #name = :name, #dueDate = :dueDate, #done = :done',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done',
            },
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
        return new AWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new AWS.DynamoDB.DocumentClient()
}

function createS3Client() {
    if (process.env.IS_OFFLINE) {
        logger.info('local')
    }

    return new AWS.S3({
        signatureVersion: 'v4'
    })
}