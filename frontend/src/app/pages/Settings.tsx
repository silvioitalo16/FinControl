import { useSettings, useUpdateSettings } from '@/app/hooks/useProfile'
import { Bell, Moon, Globe, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import type { UserSettings } from '@/app/types'

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`flex-shrink-0 transition-colors disabled:opacity-40 ${checked ? 'text-emerald-500' : 'text-gray-300'}`}
      >
        {checked
          ? <ToggleRight className="w-9 h-9" />
          : <ToggleLeft className="w-9 h-9" />}
      </button>
    </div>
  )
}

interface SectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-emerald-600" />
        {title}
      </h3>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  function toggle(key: keyof UserSettings, value: boolean) {
    updateSettings.mutate({ [key]: value })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const s = settings as UserSettings | undefined

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
      <Section title="Notificações" icon={Bell}>
        <ToggleRow
          label="Notificações push"
          description="Receba alertas no dispositivo"
          checked={s?.push_notifications ?? false}
          onChange={(v) => toggle('push_notifications', v)}
          disabled={updateSettings.isPending}
        />
        <ToggleRow
          label="Notificações por e-mail"
          description="Resumos e alertas por e-mail"
          checked={s?.email_notifications ?? false}
          onChange={(v) => toggle('email_notifications', v)}
          disabled={updateSettings.isPending}
        />
        <ToggleRow
          label="Alertas de orçamento"
          description="Aviso quando atingir 80% do limite"
          checked={s?.budget_alerts ?? false}
          onChange={(v) => toggle('budget_alerts', v)}
          disabled={updateSettings.isPending}
        />
        <ToggleRow
          label="Alertas de metas"
          description="Notificação ao completar uma meta"
          checked={s?.goal_alerts ?? false}
          onChange={(v) => toggle('goal_alerts', v)}
          disabled={updateSettings.isPending}
        />
        <ToggleRow
          label="Alertas de transações"
          description="Confirmação a cada nova transação"
          checked={s?.transaction_alerts ?? false}
          onChange={(v) => toggle('transaction_alerts', v)}
          disabled={updateSettings.isPending}
        />
      </Section>

      <Section title="Aparência" icon={Moon}>
        <ToggleRow
          label="Modo escuro"
          description="Alterar tema da interface"
          checked={s?.dark_mode ?? false}
          onChange={(v) => toggle('dark_mode', v)}
          disabled={updateSettings.isPending}
        />
      </Section>

      <Section title="Idioma e região" icon={Globe}>
        <div className="py-3">
          <p className="text-sm font-medium text-gray-800 mb-2">Idioma</p>
          <select
            value={s?.language ?? 'pt-BR'}
            onChange={(e) => updateSettings.mutate({ language: e.target.value })}
            disabled={updateSettings.isPending}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </Section>

      <Section title="Segurança" icon={Shield}>
        <ToggleRow
          label="Autenticação em dois fatores"
          description="Camada extra de proteção na conta"
          checked={s?.two_factor_enabled ?? false}
          onChange={(v) => toggle('two_factor_enabled', v)}
          disabled={updateSettings.isPending}
        />
      </Section>
    </div>
  )
}
