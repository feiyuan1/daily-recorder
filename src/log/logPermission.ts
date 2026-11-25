import { Directory, File, Paths } from "expo-file-system";

const dirPermissionFilePath = Paths.document.uri + "dr_dir_permission.txt";

export const requestDirPermission = async () => {
  const dir = await Directory.pickDirectoryAsync();
  const file = new File(dirPermissionFilePath);
  file.write(dir.uri);
};

export const getDirPermission = () => {
  const file = new File(dirPermissionFilePath);
  if (!file.exists) {
    return null;
  }
  return file.textSync();
};
