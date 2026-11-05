import {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Text } from "react-native";

function toHMS(elapsed: number) {
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const sec = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export interface RecordDurationRef {
  startRecordingProgress: () => void;
  stopRecordingProgress: () => void;
}

const RecordDuration = ({ ref }: { ref?: Ref<RecordDurationRef> }) => {
  const startTimestamp = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);

  const startRecordingProgress = useCallback(() => {
    startTimestamp.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000);
      setDuration(elapsed);
    }, 1000);
  }, []);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) {
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = null;
    setDuration(0);
  }, []);

  useImperativeHandle(ref, () => ({
    startRecordingProgress,
    stopRecordingProgress: clearTimer,
  }));

  useEffect(() => {
    return clearTimer;
  }, []);

  return <Text style={{ color: "#fff" }}>{toHMS(duration)}</Text>;
};

export default RecordDuration;
