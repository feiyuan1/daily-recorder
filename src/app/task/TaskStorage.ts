import { File, Paths } from "expo-file-system";

export const TaskStoragePath = Paths.document.uri + "task.jsonl";

export const getTaskStorage = () => {
  const file = new File(TaskStoragePath);
  if (!file.exists) {
    return null;
  }
  console.log("file.textSync()", file.textSync());
  return file.textSync();
};

export const writeTaskStorage = (tasks: string[]) => {
  const file = new File(TaskStoragePath);
  file.write(tasks.join("\n"));
};

export const deleteTaskStorage = () => {
  const file = new File(TaskStoragePath);
  file.delete();
};
