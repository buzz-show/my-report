import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { SettingsSavePayload } from '@shared/types/config'

import { getSettingsView, saveConfig } from '../config'
import { resetClient } from '../ai/client'

export function registerSettingsHandlers(): void {
  ipcMain.handle(CHANNELS.SETTINGS_GET, () => {
    return getSettingsView()
  })

  ipcMain.handle(CHANNELS.SETTINGS_SAVE, (_event, payload: SettingsSavePayload) => {
    saveConfig(payload)
    resetClient()
  })
}
