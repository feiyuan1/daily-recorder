import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { usePermissions as useMediaLibraryPermissions } from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraRatio, VideoQuality } from "../types";
import RecordDuration, { RecordDurationRef } from "./RecordDuration";
import Video from "./Video";

export default function CameraScreen() {
  const params = useLocalSearchParams<{
    title: string;
    ratio: string;
    quality: string;
  }>();
  const title = params.title;
  const ratio = params.ratio as CameraRatio;
  const quality = params.quality as VideoQuality;

  const [videoUri, setVideoUri] = useState<string | undefined>();
  const [showVideo, setShowVideo] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("front");
  const [isRecording, setIsRecording] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    useMediaLibraryPermissions({
      writeOnly: true,
    });

  const recordDurationRef = useRef<RecordDurationRef>(null);

  useEffect(() => {
    const onBackPress = () => {
      if (isRecording) {
        Alert.alert("Recording in progress", "", [
          {
            text: "still back and drop it",
            onPress: () => {
              cameraRef.current?.stopRecording();
              setIsRecording(false);
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

  if (!cameraPermission || !microphonePermission || !mediaLibraryPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
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

  if (!microphonePermission.granted) {
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

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (!cameraRef.current || !recordDurationRef.current) {
      return;
    }
    recordDurationRef.current.startRecordingProgress();
    setIsRecording(true);
    try {
      const result = await cameraRef.current.recordAsync();
      setVideoUri(result?.uri);
    } catch (error) {
      Alert.alert(
        "Recording failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsRecording(false);
      setShowVideo(true);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
    setIsRecording(false);
    setShowVideo(true);
    recordDurationRef.current?.stopRecordingProgress();
  };

  if (showVideo) {
    return <Video uri={videoUri} title={title} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        mode="video"
        facing={facing}
        ratio={ratio}
        videoQuality={quality}
        mute={false}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.topText}>{title}</Text>
          <Text style={styles.topText}>
            {ratio} · {quality}
          </Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
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
