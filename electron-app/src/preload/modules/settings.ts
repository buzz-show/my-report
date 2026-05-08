import { ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { SettingsSavePayload, SettingsView } from '@shared/types'

export const settingsBridge = {
  getSettings: (): Promise<SettingsView> => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS_GET)
  },

  saveSettings: (payload: SettingsSavePayload): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS_SAVE, payload)
  },
}