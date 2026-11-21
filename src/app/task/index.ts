import { Directory, File, Paths } from "expo-file-system";
import { Asset } from "expo-media-library";
import { Video } from "react-native-compressor";
import { generateVideoFilename } from "../../utils/filename";
import { RECORDING_DIR_NAME } from "../constants";
import useTaskStore, { TaskStatus } from "./useTaskStore";

export const runTasks = async () => {
  const taskState = useTaskStore.getState();
  if (taskState.isProcessing) {
    return;
  }
  taskState.updateTaskProcessing(true);
  runTask();
};

const runTask = async () => {
  const taskState = useTaskStore.getState();
  const tasks = taskState.tasks;
  if (tasks.length === 0) {
    taskState.updateTaskProcessing(false);
    const recordingsDir = new Directory(Paths.document, RECORDING_DIR_NAME);
    recordingsDir.delete();
    const cacheDir = new Directory(Paths.cache);
    cacheDir.delete();
    return;
  }
  const task = tasks[0];
  if (
    task.status === TaskStatus.Pending ||
    task.status === TaskStatus.Compressing
  ) {
    try {
      await Video.activateBackgroundTask();
      taskState.updateTask(task.id, {
        status: TaskStatus.Compressing,
      });
      let curProgress = 0;
      let timestamp = Date.now();
      const compressedUri = await Video.compress(
        task.originalUri,
        {
          compressionMethod: "manual",
          bitrate: 500000,
          maxSize: 720,
        },
        (newProgress) => {
          const elapsed = newProgress - curProgress;
          if (
            elapsed > 0.05 ||
            (Date.now() - timestamp > 10000 && elapsed > 0.01)
          ) {
            curProgress = newProgress;
            timestamp = Date.now();
            taskState.updateTask(task.id, {
              progress: newProgress,
            });
          }
        },
      );
      taskState.updateTask(task.id, {
        status: TaskStatus.Compressed,
        compressedUri,
      });
    } catch (error) {
      console.error("压缩失败：", error);
      taskState.updateTask(task.id, {
        status: TaskStatus.Compressed,
        compressedUri: task.originalUri,
      });
    } finally {
      await Video.deactivateBackgroundTask();
      runTask();
    }
    return;
  }
  if (task.status === TaskStatus.Compressed) {
    const filename = generateVideoFilename({
      title: task.title,
      timestamp: task.timestamp,
    });
    const source = new File(task.compressedUri!);
    const recordingsDir = new Directory(Paths.document, RECORDING_DIR_NAME);
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }
    const destination = new File(recordingsDir, filename);

    if (!destination.exists) {
      await source.move(destination);
    }
    await Asset.create(destination.uri);

    try {
      const file = new File(task.originalUri);
      file.delete();
      destination.delete();
    } finally {
      taskState.deleteTask(task.id);
      runTask();
    }
  }
};
