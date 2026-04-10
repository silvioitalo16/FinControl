import Turnstile from 'react-turnstile'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  if (!SITE_KEY) return null

  return (
    <Turnstile
      sitekey={SITE_KEY}
      onVerify={onVerify}
      onExpire={onExpire}
      theme="auto"
      refreshExpired="auto"
    />
  )
}
