import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useTaskStore, { Task, TaskStatus } from "./task/useTaskStore";

import { Directory, File, Paths } from "expo-file-system";
import { useCallback, useEffect } from "react";
import { Video } from "react-native-compressor";
import { formatBytes } from "../utils";
import { RECORDING_DIR_NAME } from "./constants";
import { runTasks } from "./task";
import { TaskStoragePath } from "./task/TaskStorage";

export default function TaskListScreen() {
  const tasks = useTaskStore((state) => state.tasks);
  const isProcessing = useTaskStore((state) => state.isProcessing);

  const handleRefresh = useCallback(() => {
    runTasks();
  }, []);

  useEffect(() => {
    console.log("tasks", tasks);
  }, [tasks]);

  return (
    <View style={styles.taskList}>
      <TaskList
        tasks={tasks}
        isRefreshing={isProcessing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

interface TaskListProps {
  tasks: Task[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: "Pending",
  [TaskStatus.Compressing]: "Compressing",
  [TaskStatus.Saved]: "Saved",
  [TaskStatus.Compressed]: "Compressed",
  [TaskStatus.Failed]: "Failed",
};

const onClean = () => {
  Alert.alert(
    "Are you sure you want to clean cache data?",
    "This will delete all cache data",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          const taskState = useTaskStore.getState();
          const recordingsDir = new Directory(RECORDING_DIR_NAME);
          if (recordingsDir.exists) {
            recordingsDir.delete();
          }
          const cacheDir = new Directory(Paths.cache);
          cacheDir.delete();
          const taskStorageFile = new File(TaskStoragePath);
          taskStorageFile.delete();
          const task = taskState.tasks[0];
          if (task.status === TaskStatus.Compressing && task.cancelId) {
            Video.cancelCompression(task.cancelId!);
          }
          taskState.initStore([]);
        },
      },
    ],
  );
};

function TaskList({ tasks, isRefreshing, onRefresh }: TaskListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks ({tasks.length})</Text>
        <TouchableOpacity style={[styles.cleanButton]} onPress={onClean}>
          <Text>clean cache data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            isRefreshing && styles.refreshButtonDisabled,
          ]}
          onPress={onRefresh}
        >
          <Image source={require("./icon/refresh.png")} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {Boolean(item.size) && (
              <Text style={styles.taskSize}>{formatBytes(item.size!)}</Text>
            )}
            <Text style={styles.taskSize}>
              {Math.floor(item.progress * 100)}%
            </Text>
            <Text
              style={[
                styles.taskStatus,
                { color: getStatusColor(item.status) },
              ]}
            >
              {statusLabels[item.status]}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet</Text>}
      />
    </View>
  );
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Pending:
      return "#999";
    case TaskStatus.Compressing:
      return "#0a7ea4";
    case TaskStatus.Saved:
      return "#2ecc71";
    case TaskStatus.Compressed:
      return "#3498db";
    case TaskStatus.Failed:
      return "#e74c3c";
    default:
      return "#999";
  }
}

const styles = StyleSheet.create({
  taskList: {
    flex: 1,
    padding: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  cleanButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
  },
  refreshButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refreshText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    marginRight: 16,
  },
  taskSize: {
    fontSize: 14,
    marginRight: 16,
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 48,
    fontSize: 16,
    color: "#999",
  },
  refreshButtonDisabled: {
    backgroundColor: "green",
  },
});
