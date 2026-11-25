import { Directory, File, Paths } from "expo-file-system";
import { Asset } from "expo-media-library";
import { Video } from "react-native-compressor";
import { ContinuedTask, ContinuedTasks } from "react-native-continued-task";
import { getErrorMessage, LogType, writeLog } from "../../log";
import { generateVideoFilename } from "../../utils/filename";
import { PACKAGE_NAME, RECORDING_DIR_NAME } from "../constants";
import useTaskStore, { TaskStatus } from "./useTaskStore";

let continuedTask: ContinuedTask | null = null;

export const runTasks = async () => {
  const taskState = useTaskStore.getState();
  if (taskState.isProcessing) {
    return;
  }
  if (taskState.tasks.length === 0) {
    return;
  }
  writeLog("[runTasks]", LogType.Info);
  taskState.updateTaskProcessing(true);
  runTaskWithBackground(taskState.tasks.length);
};

const runTaskWithBackground = async (length = 0) => {
  try {
    if (!ContinuedTasks.isSupported) {
      console.error("ContinuedTasks is not supported");
      writeLog("ContinuedTasks is not supported", LogType.Error);
      return;
    }

    continuedTask = await ContinuedTasks.submit({
      identifierPrefix: PACKAGE_NAME,
      title: "daily recorder",
      subtitle: "正在后台压缩视频",
      totalUnitCount: length,
    });

    continuedTask.addOnStopListener(({ reason, native }) => {
      writeLog(`continuedTask stopped: ${reason} ${native.name}`, LogType.Info);
    });
    await runTask();
  } catch (error) {
    writeLog(
      "runTaskWithBackground error: " + getErrorMessage(error),
      LogType.Error,
    );
    console.error("runTaskWithBackground error: ", error);
    const taskState = useTaskStore.getState();
    taskState.updateTaskProcessing(false);
  }
};

const runTask = async () => {
  const taskState = useTaskStore.getState();
  if (!taskState.isProcessing) {
    continuedTask?.complete(false);
    return;
  }
  const tasks = taskState.tasks;
  if (tasks.length === 0) {
    taskState.updateTaskProcessing(false);
    const recordingsDir = new Directory(RECORDING_DIR_NAME);
    if (recordingsDir.exists) {
      recordingsDir.delete();
    }
    const cacheDir = new Directory(Paths.cache);
    cacheDir.delete();
    if (!cacheDir.exists) {
      cacheDir.create();
    }
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }
    continuedTask?.complete(true);
    writeLog("[all tasks completed]", LogType.Info);
    return;
  }
  const task = tasks[0];
  writeLog("current task [title] " + task.title, LogType.Info);
  if (
    task.status === TaskStatus.Pending ||
    task.status === TaskStatus.Compressing
  ) {
    try {
      taskState.updateTask(task.id, {
        status: TaskStatus.Compressing,
      });
      writeLog("task status update to compressing", LogType.Info);
      let curProgress = 0;
      let timestamp = Date.now();
      const compressedUri = await Video.compress(
        task.originalUri,
        {
          compressionMethod: "manual",
          bitrate: 500000,
          maxSize: 720,
          getCancellationId: (cancellationId) =>
            taskState.updateTask(task.id, { cancelId: cancellationId }),
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
            continuedTask?.setProgress(Math.floor(curProgress * 100), 100);
          }
        },
      );
      taskState.updateTask(task.id, {
        status: TaskStatus.Compressed,
        compressedUri,
      });
      continuedTask?.updateTitle("daily recorder", "压缩完成");
      writeLog("compress completed", LogType.Info);
    } catch (error) {
      console.error("压缩失败：", error);
      if (task.originalUri.includes(PACKAGE_NAME)) {
        taskState.updateTask(task.id, {
          status: TaskStatus.Compressed,
          compressedUri: task.originalUri,
        });
      } else {
        taskState.updateTask(task.id, {
          status: TaskStatus.Failed,
        });
      }
      writeLog("compress failed" + getErrorMessage(error), LogType.Error);
    } finally {
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
    const recordingsDir = new Directory(RECORDING_DIR_NAME);
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }
    const destination = new File(recordingsDir, filename);

    if (!destination.exists) {
      await source.move(destination);
    }
    await Asset.create(destination.uri);

    try {
      if (task.originalUri.includes(PACKAGE_NAME)) {
        const file = new File(task.originalUri);
        file.delete();
      }
      destination.delete();
    } catch (err) {
      writeLog("delete file failed" + getErrorMessage(err), LogType.Error);
    } finally {
      taskState.deleteTask(task.id);
      continuedTask?.setProgress(1, 1);
      continuedTask?.updateTitle("daily recorder", "保存完毕");
      runTask();
    }
    return;
  }
  if (task.status === TaskStatus.Failed) {
    taskState.deleteTask(task.id);
    continuedTask?.setProgress(1, 1);
    continuedTask?.updateTitle("daily recorder", "任务执行失败");
    runTask();
  }
};
