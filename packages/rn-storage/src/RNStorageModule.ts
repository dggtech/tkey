import { DeviceShareDescription, IModule, ITKeyApi, ShareStore, StringifiedType } from "@tkey/common-types";
import { getShareFromLocalStorage, storeShareOnLocalStorage } from "./LocalStorageHelpers";

export const RN_STORAGE_MODULE_NAME = "rnStorage";

class RNStorageModule implements IModule {
  moduleName: string;

  tbSDK: ITKeyApi;

  canUseFileStorage: boolean;

  constructor(canUseFileStorage = true) {
    this.moduleName = RN_STORAGE_MODULE_NAME;
    this.canUseFileStorage = canUseFileStorage;
  }

  setModuleReferences(tbSDK: ITKeyApi): void {
    this.tbSDK = tbSDK;
    this.tbSDK._setDeviceStorage(this.storeDeviceShare.bind(this));
  }

  // eslint-disable-next-line
  async initialize(): Promise<void> {}

  async storeDeviceShare(deviceShareStore: ShareStore, customDeviceInfo?: StringifiedType): Promise<void> {
    const metadata = this.tbSDK.getMetadata();
    const tkeypubx = metadata.pubKey.x.toString("hex");
    await storeShareOnLocalStorage(deviceShareStore, tkeypubx);
    const shareDescription: DeviceShareDescription = {
      module: this.moduleName,
      userAgent: navigator.userAgent,
      dateAdded: Date.now(),
    };
    if (customDeviceInfo) {
      shareDescription.customDeviceInfo = JSON.stringify(customDeviceInfo);
    }
    await this.tbSDK.addShareDescription(deviceShareStore.share.shareIndex.toString("hex"), JSON.stringify(shareDescription), true);
  }

  async getDeviceShare(): Promise<ShareStore> {
    const metadata = this.tbSDK.getMetadata();
    const tkeypubx = metadata.pubKey.x.toString("hex");
    let shareStore: ShareStore;
    try {
      shareStore = await getShareFromLocalStorage(tkeypubx);
    } catch (localErr) {
      console.log("🚀 ~ file: RNStorageModule.ts:53 ~ RNStorageModule ~ getDeviceShare ~ localErr:", localErr);
      throw localErr;
    }
    return shareStore;
  }

  async inputShareFromWebStorage(): Promise<void> {
    const shareStore = await this.getDeviceShare();
    let latestShareStore = shareStore;
    const metadata = this.tbSDK.getMetadata();
    if (metadata.getLatestPublicPolynomial().getPolynomialID() !== shareStore.polynomialID) {
      latestShareStore = (await this.tbSDK.catchupToLatestShare({ shareStore, includeLocalMetadataTransitions: true })).latestShare;
      const tkeypubx = metadata.pubKey.x.toString("hex");
      await storeShareOnLocalStorage(latestShareStore, tkeypubx);
    }
    this.tbSDK.inputShareStore(latestShareStore);
  }
}

export default RNStorageModule;
