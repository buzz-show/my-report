import { ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'

export const runtimeBridge = {
  getBaseUrl: (): Promise<string> => ipcRenderer.invoke(CHANNELS.RUNTIME_GET_BASE_URL),
}
