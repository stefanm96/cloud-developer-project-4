import * as uuid from 'uuid'
import { parseUserId } from '../auth/utils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoAccess } from '../dataLayer/todosAccess'
import { stringify } from 'querystring'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

// creates a todo item
export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    jwtToken: string
): Promise<TodoItem> {

    const userId = parseUserId(jwtToken)
    const itemId = uuid.v4()

    return await todoAccess.createTodo({
        userId: userId,
        todoId: itemId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false
    })
}

// gets all Todos by the userId
export async function getAllTodos(jwtToken: string): Promise<TodoItem[]> {
    const userId = parseUserId(jwtToken)

    return todoAccess.getAllTodos(userId)
}

export async function getAttachmentUploadUrl(jwtToken: string, todoId: string) {
    const userId = parseUserId(jwtToken)

    return todoAccess.getAttachementUploadUrl(todoId)
}

export async function todoExists(userId: string, todoId: string): Promise<Boolean> {
    return todoAccess.todoExists(userId, todoId)
}

export async function deleteTodo(jwtToken: string, todoId: string) {
    const userId = parseUserId(jwtToken)

    return todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, jwtToken: string, todoId: string) {
    const userId = parseUserId(jwtToken)

    const todoUpdate = {
        ...updateTodoRequest
    }

    return todoAccess.updateTodo(todoUpdate, userId, todoId)
}