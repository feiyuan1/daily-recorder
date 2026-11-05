import { Paths } from "expo-file-system";

const MIN_SPACE = 500 * 1024 * 1000;

export const isEnoughAvailableSpace = () => {
  return Paths.availableDiskSpace > MIN_SPACE;
};
