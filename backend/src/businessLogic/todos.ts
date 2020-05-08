import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoAccess } from '../dataLayer/todosAccess'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

// creates a todo item
export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

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
export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    return todoAccess.getAllTodos(userId)
}

export async function getAttachmentUploadUrl(userId: string, todoId: string) {
    return todoAccess.getAttachementUploadUrl(userId, todoId)
}

export async function todoExists(userId: string, todoId: string): Promise<Boolean> {
    return todoAccess.todoExists(userId, todoId)
}

export async function deleteTodo(userId: string, todoId: string) {
    return todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, userId: string, todoId: string) {
    const todoUpdate = {
        ...updateTodoRequest
    }

    return todoAccess.updateTodo(todoUpdate, userId, todoId)
}