import * as DocumentPicker from "expo-document-picker";
import { Paths } from "expo-file-system";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraRatio, VideoQuality } from "../types";
import { isEnoughAvailableSpace } from "../utils";
import VideoSaver from "./Video";

const RATIOS: CameraRatio[] = ["4:3", "16:9", "1:1"];
const QUALITIES: VideoQuality[] = ["2160p", "1080p", "720p", "480p"];

export default function HomeScreen() {
  const [title, setTitle] = useState("");
  const isDisabledRecord = !title.trim() || !isEnoughAvailableSpace();
  const [uri, setUri] = useState<string>();
  const [timestamp, setTimestamp] = useState<number>();

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
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        console.log("文件time:", file.lastModified);
        setUri(file.uri);
        setTimestamp(file.lastModified);
      }
    } catch (err) {
      console.error("选择文件失败", err);
    }
  };

  if (uri) {
    return <VideoSaver uri={uri} title={title} timestamp={timestamp} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.heading}>Daily Recorder</Text>
      <Text style={styles.description}>
        Available space: {Paths.availableDiskSpace / 1024 / 1000}M
      </Text>

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
});
