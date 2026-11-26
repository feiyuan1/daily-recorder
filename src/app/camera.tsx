import { File } from "expo-file-system";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  CommonResolutions,
  Recorder,
  TargetCameraPosition,
  useVideoOutput,
} from "react-native-vision-camera";
import RecordDuration, { RecordDurationRef } from "./RecordDuration";
import { runTasks } from "./task";
import useTaskStore from "./task/useTaskStore";

const CameraInner = () => {
  const params = useLocalSearchParams<{
    title: string;
  }>();
  const title = params.title;
  const [facing, setFacing] = useState<TargetCameraPosition>("front");
  const [isRecording, setIsRecording] = useState(false);
  const videoOutput = useVideoOutput({
    enableAudio: true,
    targetResolution: CommonResolutions.HD_4_3,
  });
  const recorderRef = useRef<Recorder>(null);

  const recordDurationRef = useRef<RecordDurationRef>(null);

  const createTask = useTaskStore((state) => state.createTask);

  useEffect(() => {
    videoOutput.setOutputSettings({ codec: "h265" });
    const init = async () => {
      recorderRef.current = await videoOutput.createRecorder({});
    };
    init();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (!recorderRef.current) {
        return false;
      }
      if (isRecording) {
        Alert.alert("Recording in progress", "", [
          {
            text: "still back and drop it",
            onPress: () => {
              cancelRecording();
              router.back();
            },
          },
          {
            text: "cancel",
          },
        ]);
      }
      return isRecording;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [isRecording]);

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const onRecordingFinished = (filePath: string) => {
    const formattedPath = "file://" + filePath;
    const file = new File(formattedPath);
    createTask({
      title,
      originalUri: formattedPath,
      timestamp: Date.now(),
      size: file.size,
    });
    runTasks();
    router.replace("/tasklist");
  };

  const onRecordingError = (error: Error) => {
    Alert.alert("Recording failed", error.message);
    cancelRecording();
  };

  const startRecording = async () => {
    if (!recorderRef.current || !recordDurationRef.current) {
      return;
    }
    recordDurationRef.current.startRecordingProgress();
    setIsRecording(true);
    await recorderRef.current.startRecording(
      onRecordingFinished,
      onRecordingError,
    );
    activateKeepAwakeAsync();
  };

  const stopRecording = () => {
    recorderRef.current?.stopRecording();
    setIsRecording(false);
    recordDurationRef.current?.stopRecordingProgress();
    deactivateKeepAwake();
  };

  const cancelRecording = () => {
    recorderRef.current?.cancelRecording();
    setIsRecording(false);
    recordDurationRef.current?.stopRecordingProgress();
    deactivateKeepAwake();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Camera
        style={styles.camera}
        device={facing}
        isActive={true}
        outputs={[videoOutput]}
        constraints={[{ resolutionBias: videoOutput, fps: 30 }]}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.topText}>{title}</Text>
          <RecordDuration ref={recordDurationRef} />
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleFacing}
            disabled={isRecording}
          >
            <Text style={styles.flipText}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.stopButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View
              style={[styles.recordInner, isRecording && styles.stopInner]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 64,
  },
  topBar: {
    alignItems: "center",
    gap: 4,
  },
  topText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  flipButton: {
    padding: 12,
  },
  flipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    borderColor: "#ff4444",
  },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ff4444",
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
});

export default CameraInner;
