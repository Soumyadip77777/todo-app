"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Trash2, Plus, CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, isAfter, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type Todo = {
  id: string
  text: string
  status: "pending" | "completed" | "expired"
  date: Date
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "expired">("all")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())

      // Check for expired todos
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.status === "pending" && isAfter(currentTime, new Date(todo.date))) {
            return { ...todo, status: "expired" }
          }
          return todo
        }),
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos")
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos)
        // Convert string dates back to Date objects
        const todosWithDates = parsedTodos.map((todo: any) => ({
          ...todo,
          date: new Date(todo.date),
        }))

        // Check for expired todos on load
        const updatedTodos = todosWithDates.map((todo: Todo) => {
          if (todo.status === "pending" && isAfter(new Date(), new Date(todo.date))) {
            return { ...todo, status: "expired" }
          }
          return todo
        })

        setTodos(updatedTodos)
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error)
      }
    }
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim() === "") return

    const newTodoItem: Todo = {
      id: crypto.randomUUID(),
      text: newTodo,
      status: "pending",
      date: date,
    }

    // Check if already expired
    if (isAfter(new Date(), date)) {
      newTodoItem.status = "expired"
    }

    setTodos([...todos, newTodoItem])
    setNewTodo("")
  }

  const toggleTodoStatus = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, status: todo.status === "pending" ? "completed" : "pending" } : todo,
      ),
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true
    return todo.status === filter
  })

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-gradient-to-br from-background to-accent/20">
      <Card className="w-full max-w-3xl shadow-xl border-2 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Todo App
            </CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </div>
          <ModeToggle />
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              className="flex-1 border-2 focus-visible:ring-primary"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto border-2">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  className="rounded-md border-2"
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={addTodo}
              className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                Expired
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TodoList
                todos={filteredTodos}
                onToggle={toggleTodoStatus}
                onDelete={deleteTodo}
                currentTime={currentTime}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <TodoList
                todos={filteredTodos}
                onToggle={toggleTodoStatus}
                onDelete={deleteTodo}
                currentTime={currentTime}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <TodoList
                todos={filteredTodos}
                onToggle={toggleTodoStatus}
                onDelete={deleteTodo}
                currentTime={currentTime}
              />
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              <TodoList
                todos={filteredTodos}
                onToggle={toggleTodoStatus}
                onDelete={deleteTodo}
                currentTime={currentTime}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between bg-gradient-to-r from-accent/10 to-primary/10 rounded-b-lg p-4">
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
              {todos.filter((t) => t.status === "completed").length} completed
            </Badge>
            <Badge variant="outline" className="bg-secondary/20 hover:bg-secondary/30">
              {todos.filter((t) => t.status === "pending").length} pending
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 hover:bg-destructive/20">
              {todos.filter((t) => t.status === "expired").length} expired
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(), "PPP p")}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

function TodoList({
  todos,
  onToggle,
  onDelete,
  currentTime,
}: {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  currentTime: Date
}) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-accent/5 rounded-lg border-2 border-dashed border-accent/20">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          <p>No tasks found. Add some tasks to get started!</p>
        </div>
      </div>
    )
  }

  const getCountdown = (todoDate: Date) => {
    if (isAfter(currentTime, todoDate)) {
      return "Expired"
    }

    const days = differenceInDays(todoDate, currentTime)
    const hours = differenceInHours(todoDate, currentTime) % 24
    const minutes = differenceInMinutes(todoDate, currentTime) % 60

    if (days > 0) {
      return `${days}d ${hours}h remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  const getTimeProgress = (todoDate: Date) => {
    // If already expired, return 100%
    if (isAfter(currentTime, todoDate)) {
      return 100
    }

    // Calculate progress based on creation date (assuming it was created 7 days before due date)
    const totalDuration = 7 * 24 * 60 // 7 days in minutes
    const elapsed = differenceInMinutes(currentTime, new Date(todoDate.getTime() - 7 * 24 * 60 * 60 * 1000))

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => {
        const countdown = getCountdown(todo.date)
        const progress = getTimeProgress(todo.date)

        return (
          <div
            key={todo.id}
            className={cn(
              "flex flex-col p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.01]",
              "border-2 hover:shadow-md",
              todo.status === "completed"
                ? "bg-primary/5 border-primary/30"
                : todo.status === "expired"
                  ? "bg-destructive/5 border-destructive/30"
                  : "bg-card border-accent/30",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={todo.status === "completed"}
                  onCheckedChange={() => todo.status !== "expired" && onToggle(todo.id)}
                  disabled={todo.status === "expired"}
                  className={cn(
                    "h-5 w-5 transition-colors",
                    todo.status === "expired"
                      ? "data-[state=checked]:bg-destructive"
                      : "data-[state=checked]:bg-primary",
                  )}
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-medium transition-all",
                      todo.status === "completed" && "line-through text-muted-foreground",
                      todo.status === "expired" && "text-destructive/80",
                    )}
                  >
                    {todo.text}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    {format(todo.date, "PPP")}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(todo.id)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {todo.status === "pending" && (
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span
                    className={cn(
                      "font-medium",
                      progress > 75 ? "text-destructive" : progress > 50 ? "text-amber-500" : "text-emerald-500",
                    )}
                  >
                    {countdown}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    "h-1.5",
                    progress > 75 ? "bg-destructive/20" : progress > 50 ? "bg-amber-500/20" : "bg-emerald-500/20",
                  )}
                  indicatorClassName={cn(
                    progress > 75 ? "bg-destructive" : progress > 50 ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

