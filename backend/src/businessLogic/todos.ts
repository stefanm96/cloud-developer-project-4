import * as uuid from 'uuid'
import { parseUserId } from '../auth/utils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoAccess } from '../dataLayer/todosAccess'

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