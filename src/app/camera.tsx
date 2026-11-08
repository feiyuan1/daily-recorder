import { usePermissions as useMediaLibraryPermissions } from "expo-media-library";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";
import CameraInner from "./CameraInner";

export default function CameraScreen() {
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

  return <CameraInner />;
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
});
