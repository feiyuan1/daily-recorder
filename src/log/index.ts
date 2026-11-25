import { Directory, File } from "expo-file-system";
import { getDirPermission } from "./logPermission";

const DIR_NAME = "dr-logs";

export enum LogType {
  Info = "info",
  Error = "error",
}

function getOrCreateDir(dir: Directory, target: string) {
  const entries = dir.list();
  const existingDir = entries.find((entry) => {
    return entry instanceof Directory && entry.name === target;
  });

  if (existingDir) {
    return existingDir as Directory;
  } else {
    return dir.createDirectory(target);
  }
}

function getOrCreateFile(dir: Directory, target: string) {
  const entries = dir.list();
  const existingFile = entries.find((entry) => {
    return entry instanceof File && entry.name === target;
  });

  if (existingFile) {
    return existingFile as File;
  } else {
    return dir.createFile(target, "text/plain");
  }
}

const getDirPermissionDirectory = () => {
  const permission = getDirPermission();
  if (!permission) {
    return;
  }
  const dir = new Directory(permission);
  if (!dir.exists) {
    return;
  }
  return dir;
};

const clearOutdatedLog = () => {
  const dir = getDirPermissionDirectory();
  if (!dir) {
    return;
  }
  const entries = getOrCreateDir(dir, DIR_NAME).list();
  entries.forEach((entry) => {
    const matched = entry.name.match(/log_(.*)\.txt/);
    if (!matched) {
      entry.delete();
      return;
    }
    const date = Date.parse(matched[1]);
    if (!date) {
      entry.delete();
      return;
    }
    if (Date.now() - date > 1000 * 60 * 60 * 24 * 15) {
      entry.delete();
      return;
    }
  });
};

export const getErrorMessage = (error: unknown) => {
  return typeof error === "string"
    ? (error as string)
    : (error as Error).message;
};

const getLogFile = () => {
  const dir = getDirPermissionDirectory();
  if (!dir) {
    return;
  }
  const logDir = getOrCreateDir(dir, DIR_NAME);
  const fileName = `log_${new Date().toISOString().slice(0, 10)}.txt`;
  return getOrCreateFile(logDir, fileName);
};

export const writeLog = (content: string, logType: LogType) => {
  const logFile = getLogFile();
  if (!logFile) {
    return;
  }
  const newContent = `${logType}: ${content}\n`;
  logFile.write(newContent, { append: true });
};

export const readLog = () => {
  const logFile = getLogFile();
  if (!logFile) {
    return;
  }
  return logFile.textSync();
};

export const clearAllLog = () => {
  const dir = getDirPermissionDirectory();
  if (!dir) {
    return;
  }
  const entries = dir.list();
  const existingDir = entries.find((entry) => {
    return entry instanceof Directory && entry.name === DIR_NAME;
  });
  if (!existingDir) {
    return;
  }
  existingDir.delete();
};

clearOutdatedLog();
