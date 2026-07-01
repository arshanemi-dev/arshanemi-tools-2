import LocalModeSettings     from '@/components/settings/LocalModeSettings'
import ConnectedModeSettings from '@/components/settings/ConnectedModeSettings'

export const metadata = { title: 'Settings — ArshaNemi PDF Tools' }

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'

export default function SettingsPage() {
  return IS_CONNECT ? <ConnectedModeSettings /> : <LocalModeSettings />
}
