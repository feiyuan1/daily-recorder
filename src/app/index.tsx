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

const RATIOS: CameraRatio[] = ["4:3", "16:9", "1:1"];
const QUALITIES: VideoQuality[] = ["2160p", "1080p", "720p", "480p"];

export default function HomeScreen() {
  const [title, setTitle] = useState("");
  const [ratio, setRatio] = useState<CameraRatio>("4:3");
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const isDisabledRecord = !title.trim() || !isEnoughAvailableSpace();

  const handleStart = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Please enter a title");
      return;
    }
    router.push({
      pathname: "/camera",
      params: { title: trimmed, ratio, quality },
    });
  };

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

      <View style={styles.field}>
        <Text style={styles.label}>Aspect Ratio</Text>
        <View style={styles.options}>
          {RATIOS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.option, ratio === r && styles.optionActive]}
              onPress={() => setRatio(r)}
            >
              <Text
                style={[
                  styles.optionText,
                  ratio === r && styles.optionTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Video Quality</Text>
        <View style={styles.options}>
          {QUALITIES.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.option, quality === q && styles.optionActive]}
              onPress={() => setQuality(q)}
            >
              <Text
                style={[
                  styles.optionText,
                  quality === q && styles.optionTextActive,
                ]}
              >
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isDisabledRecord && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={isDisabledRecord}
      >
        <Text style={styles.buttonText}>Start Recording</Text>
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
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionActive: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "600",
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
