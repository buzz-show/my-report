import { ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { LoginPayload, SessionView } from '@shared/types'

export const authBridge = {
  login: (payload: LoginPayload): Promise<SessionView> => {
    return ipcRenderer.invoke(CHANNELS.AUTH_LOGIN, payload)
  },

  logout: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.AUTH_LOGOUT)
  },

  getSession: (): Promise<SessionView | null> => {
    return ipcRenderer.invoke(CHANNELS.AUTH_GET_SESSION)
  },

  getAccessToken: (): Promise<string | null> => {
    return ipcRenderer.invoke(CHANNELS.AUTH_GET_ACCESS_TOKEN)
  },
}
