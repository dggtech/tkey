import { StringifiedType } from "@tkey/common-types";
import { ServiceProviderBase } from "@tkey/service-provider-base";
// import { getPublic, sign } from "@toruslabs/eccrypto";
// import { decryptData, encryptData, keccak256 } from "@toruslabs/metadata-helpers";
import base64url from "base64url";
// import EventEmitter from "events";
import log from "loglevel";
import { URL } from "react-native-url-polyfill";

import { IWebBrowser } from "./types/IWebBrowser";
import { SdkInitParams, SdkLoginParams } from "./types/sdk";

(process as any).browser = true;

class TorusServiceProvider extends ServiceProviderBase {
  initParams: SdkInitParams;

  webBrowser: IWebBrowser;

  constructor({
    enableLogging = false,
    postboxKey,
    webBrowser,
    initParams,
  }: {
    enableLogging?: boolean;
    postboxKey?: string;
    webBrowser: IWebBrowser;
    initParams: SdkInitParams;
  }) {
    super({ enableLogging, postboxKey });
    this.serviceProviderName = "TorusServiceProvider";
    this.initParams = initParams;
    if (!this.initParams.sdkUrl) {
      this.initParams.sdkUrl = "https://sdk.openlogin.com";
    }
    this.webBrowser = webBrowser;
  }

  static fromJSON(value: StringifiedType): TorusServiceProvider {
    const { enableLogging, postboxKey, webBrowser, initParams, serviceProviderName } = value;
    if (serviceProviderName !== "TorusServiceProvider") return undefined;

    return new TorusServiceProvider({
      enableLogging,
      postboxKey,
      webBrowser,
      initParams,
    });
  }

  async triggerLogin(options: SdkLoginParams) {
    // const obj = await this.directWeb.triggerLogin(params);
    // this.postboxKey = new BN(obj.privateKey, "hex");
    // return obj;
    const result = await this.request("login", options.redirectUrl, options);
    console.log("🚀 ~ file: TorusServiceProvider.ts:59 ~ TorusServiceProvider ~ triggerLogin ~ result:", result);
    return result;
  }

  private async request(path: string, redirectUrl: string, params: Record<string, unknown> = {}) {
    const initParams = {
      ...this.initParams,
      clientId: this.initParams.clientId,
      network: this.initParams.network,
      ...(!!this.initParams.redirectUrl && {
        redirectUrl: this.initParams.redirectUrl,
      }),
    };

    const mergedParams = {
      init: initParams,
      params: {
        ...params,
        ...(!params.redirectUrl && { redirectUrl }),
      },
    };

    log.debug(`[Web3Auth] params passed to Web3Auth: ${mergedParams}`);

    const hash = base64url.encode(JSON.stringify(mergedParams));

    const url = new URL(this.initParams.sdkUrl);
    url.pathname = `${url.pathname}${path}`;
    url.hash = hash;

    log.info(`[Web3Auth] opening login screen in browser at ${url.href}, will redirect to ${redirectUrl}`);

    return this.webBrowser.openAuthSessionAsync(url.href, redirectUrl);
  }

  toJSON(): StringifiedType {
    return {
      ...super.toJSON(),
      serviceProviderName: this.serviceProviderName,
      webBrowser: this.webBrowser,
      initParams: this.initParams,
    };
  }
}

export default TorusServiceProvider;
