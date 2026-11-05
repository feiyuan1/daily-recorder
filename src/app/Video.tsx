import { Directory, File, Paths } from "expo-file-system";
import { Asset } from "expo-media-library";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Video } from "react-native-compressor";
import { generateVideoFilename } from "../utils/filename";

enum CompressStatus {
  PENDING = "PENDING",
  PROGRESSING = "PROGRESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}
const VideoSaver = ({ uri, title }: { uri?: string; title: string }) => {
  const handleRecordAnother = () => {
    router.replace("/");
  };
  const [compressStatus, setCompressStatus] = useState<CompressStatus>(
    CompressStatus.PENDING,
  );
  const [progressing, setProgressing] = useState(0);
  const compressUri = useRef(uri);

  if (!uri) {
    return (
      <View>
        <Text>No video available</Text>
        <View style={{ width: "100%" }}>
          <Button title="Record another" onPress={handleRecordAnother} />
        </View>
      </View>
    );
  }
  const comPressVideo = async () => {
    setCompressStatus(CompressStatus.PROGRESSING);
    try {
      compressUri.current = await Video.compress(
        uri,
        {
          compressionMethod: "manual",
          bitrate: 2000000,
          maxSize: 1280,
        },
        (progress) => {
          setProgressing(progress);
        },
      );
      setCompressStatus(CompressStatus.SUCCESS);
    } catch (error) {
      console.error("压缩失败：", error);
      setCompressStatus(CompressStatus.FAILED);
      compressUri.current = uri;
    }
  };

  if (compressStatus === CompressStatus.PENDING) {
    return (
      <View style={styles.wrapper}>
        <View style={{ width: "100%" }}>
          <Button
            title="start compress"
            disabled={compressStatus !== CompressStatus.PENDING}
            onPress={comPressVideo}
          />
          <Button title="Record another" onPress={handleRecordAnother} />
        </View>
      </View>
    );
  }

  const handleSaveVideo = async () => {
    const filename = generateVideoFilename(title);
    const source = new File(compressUri.current!);
    const recordingsDir = new Directory(Paths.document, "recordings");
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }
    const destination = new File(recordingsDir, filename);

    await source.copy(destination);

    const asset = await Asset.create(destination.uri);

    router.replace({
      pathname: "/success",
      params: { title, uri: destination.uri, assetId: asset.id },
    });
  };

  if (
    compressStatus === CompressStatus.FAILED ||
    compressStatus === CompressStatus.SUCCESS
  ) {
    return (
      <View style={styles.wrapper}>
        <Text>Video compress {compressStatus}</Text>
        <View style={{ width: "100%" }}>
          <Button
            title="Save Compressed/Original Video"
            onPress={handleSaveVideo}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.wrapper}>
      <Text>Video compressing {Math.floor(progressing * 100)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
});
export default VideoSaver;
