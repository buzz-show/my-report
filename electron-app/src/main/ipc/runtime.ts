import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'

const DEFAULT_PORT = 18765

function getRuntimeBaseUrl(): string {
  const port = process.env['AI_RUNTIME_PORT'] ?? DEFAULT_PORT
  return `http://127.0.0.1:${port}`
}

export function registerRuntimeHandlers(): void {
  ipcMain.handle(CHANNELS.RUNTIME_GET_BASE_URL, () => getRuntimeBaseUrl())
}
