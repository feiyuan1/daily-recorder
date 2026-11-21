import { Paths } from "expo-file-system";

const MIN_SPACE = 500 * 1024 * 1000;

export const isEnoughAvailableSpace = () => {
  return Paths.availableDiskSpace > MIN_SPACE;
};

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes <= 0) return "0 MB";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;

  // 计算 MB 和 GB 的值
  const mb = bytes / (k * k);
  const gb = bytes / (k * k * k);

  // 如果超过或等于 1GB，显示 GB，否则显示 MB
  if (gb >= 1) {
    // 使用 parseFloat 去除多余的 ".00"
    return `${parseFloat(gb.toFixed(dm))} GB`;
  } else {
    return `${parseFloat(mb.toFixed(dm))} MB`;
  }
}
