import { create, StoreApi, UseBoundStore } from "zustand";
import { getErrorMessage, LogType, writeLog } from "../../log";
import { getTaskStorage, writeTaskStorage } from "./TaskStorage";

export enum TaskStatus {
  Pending = "PENDING",
  Compressing = "Compressing",
  Saved = "SAVED",
  Compressed = "COMPRESSED",
  Failed = "FAILED",
}

export interface Task {
  title: string;
  originalUri: string;
  progress: number;
  timestamp: number;
  size?: number;
  id: number;
  cancelId?: string;
  status: TaskStatus;
  compressedUri?: string;
}

type NewTask = Pick<Task, "title" | "originalUri" | "timestamp" | "size">;

export type TaskStore = TaskState & TaskAction;

interface TaskState {
  tasks: Task[];
  isProcessing: boolean;
}

interface TaskAction {
  updateTaskProcessing: (isProcessing: boolean) => void;
  createTask: (task: NewTask) => void;
  deleteTask: (id: number) => void;
  updateTask: (id: number, task: Partial<Task>) => void;
  initStore: (tasks: Required<Task>[]) => void;
}

const getInitTasks = () => {
  try {
    const tasks = getTaskStorage();
    if (!tasks) {
      return [];
    }
    return tasks.split("\n").map((task) => JSON.parse(task) as Task);
  } catch (error) {
    console.error("error init tasks", (error as Error)?.message || error);
    writeLog("error init tasks" + getErrorMessage(error), LogType.Error);
    return [];
  }
};

let taskStore: UseBoundStore<StoreApi<TaskStore>> | null = null;
const createTaskStore = () => {
  if (!taskStore) {
    const initTasks = getInitTasks();
    taskStore = create<TaskStore>((set) => ({
      tasks: initTasks,
      isProcessing: false,
      updateTaskProcessing: (isProcessing: boolean) => set({ isProcessing }),
      createTask: (task: NewTask) =>
        set((state) => {
          const newTasks = [
            ...state.tasks,
            {
              id: task.timestamp,
              ...task,
              status: TaskStatus.Pending,
              progress: 0,
            },
          ];
          writeTaskStorage(newTasks.map((task) => JSON.stringify(task)));
          return {
            tasks: newTasks,
          };
        }),
      deleteTask: (id: number) => {
        set((state) => {
          if (state.tasks[0]?.id !== id) {
            return { tasks: state.tasks };
          }
          const newTasks = state.tasks.slice(1);
          writeTaskStorage(newTasks.map((task) => JSON.stringify(task)));
          return { tasks: newTasks };
        });
      },
      updateTask: (id, updatedTask) =>
        set((state) => {
          if (state.tasks[0]?.id !== id) {
            return { tasks: state.tasks };
          }
          const newTasks = [
            { ...state.tasks[0], ...updatedTask },
            ...state.tasks.slice(1),
          ];
          writeTaskStorage(newTasks.map((task) => JSON.stringify(task)));
          return {
            tasks: newTasks,
          };
        }),
      initStore: (tasks) => set({ tasks }),
    }));
  }
  return taskStore;
};

const useTaskStore = createTaskStore();

export default useTaskStore;
