import * as DocumentPicker from "expo-document-picker";
import { Paths } from "expo-file-system";
import { usePermissions as useMediaLibraryPermissions } from "expo-media-library";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";
import { getDirPermission, requestDirPermission } from "../log/logPermission";
import { formatBytes, isEnoughAvailableSpace } from "../utils";
import { runTasks } from "./task";
import useTaskStore from "./task/useTaskStore";

export default function HomeScreen() {
  const {
    hasPermission: cameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: microphonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    useMediaLibraryPermissions({
      writeOnly: true,
    });

  useEffect(() => {
    if (getDirPermission()) {
      return;
    }
    Alert.alert(
      "Please grant permission to access the directory to save logs",
      "for debug",
      [
        {
          text: "OK",
          onPress: requestDirPermission,
        },
      ],
    );
  }, []);

  if (!mediaLibraryPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Camera permission is required to record video.
        </Text>
        <Button
          onPress={requestCameraPermission}
          title="Grant camera permission"
        />
      </View>
    );
  }

  if (!microphonePermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Microphone permission is required to record audio.
        </Text>
        <Button
          onPress={requestMicrophonePermission}
          title="Grant microphone permission"
        />
      </View>
    );
  }

  if (!mediaLibraryPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Media library permission is required to save videos.
        </Text>
        <Button
          onPress={requestMediaLibraryPermission}
          title="Grant media library permission"
        />
      </View>
    );
  }

  return <HomeInner />;
}

function HomeInner() {
  const [title, setTitle] = useState("");
  const isDisabledRecord = !title.trim() || !isEnoughAvailableSpace();
  const createTask = useTaskStore((state) => state.createTask);

  useEffect(() => {
    if (!isEnoughAvailableSpace()) {
      Alert.alert("not enough space");
    }
  }, []);

  const handleStart = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Please enter a title");
      return;
    }
    router.push({
      pathname: "/camera",
      params: { title: trimmed },
    });
  };

  const pickFile = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Please enter a title");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: false,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        createTask({
          title: trimmed,
          originalUri: file.uri,
          timestamp: file.lastModified,
          size: file.size,
        });
        runTasks();
        router.push("/tasklist");
      }
    } catch (err) {
      console.error("选择文件失败", err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.heading}>Daily Recorder</Text>
      <Text style={styles.description}>
        Available space: {formatBytes(Paths.availableDiskSpace)}
      </Text>
      <TouchableOpacity
        style={styles.taskListButton}
        onPress={() => router.push("/tasklist")}
      >
        <Image
          source={require("./icon/transport.png")}
          style={styles.transport}
        />
      </TouchableOpacity>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter recording title"
          placeholderTextColor="#999"
          maxLength={50}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isDisabledRecord && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={isDisabledRecord}
      >
        <Text style={styles.buttonText}>Start Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !title.trim() && styles.buttonDisabled]}
        onPress={pickFile}
        disabled={!title.trim()}
      >
        <Text style={styles.buttonText}>pickFile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 96,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  taskListButton: {
    position: "absolute",
    top: 40,
    right: 20,
    height: 30,
    width: 30,
  },
  transport: {
    height: "100%",
    width: "100%",
  },
});
