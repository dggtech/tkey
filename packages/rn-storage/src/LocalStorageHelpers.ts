import { ShareStore } from "@tkey/common-types";
import AsyncStorage, { AsyncStorageStatic } from "@react-native-async-storage/async-storage";

function storageAvailable(): boolean {
  let storage: AsyncStorageStatic;
  try {
    storage = AsyncStorage;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export const storeShareOnLocalStorage = async (share: ShareStore, key: string): Promise<void> => {
  const fileStr = JSON.stringify(share);
  if (!storageAvailable()) {
    throw new Error("Local storage is not enabled");
  }
  AsyncStorage.setItem(key, fileStr);
};

export const getShareFromLocalStorage = async (key: string): Promise<ShareStore> => {
  if (!storageAvailable()) {
    throw new Error("Local storage is not enabled");
  }
  const foundFile = await AsyncStorage.getItem(key);
  if (!foundFile) {
    throw new Error("No share exists in localstorage");
  }
  return ShareStore.fromJSON(JSON.parse(foundFile));
};
