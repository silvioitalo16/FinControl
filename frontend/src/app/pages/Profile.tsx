import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Edit2, Save, X, Lock, User, Calendar, Phone, MapPin } from 'lucide-react'
import { useProfile, useUpdateProfile, useUploadAvatar, useChangePassword } from '@/app/hooks/useProfile'
import { useTransactions } from '@/app/hooks/useTransactions'
import { useGoals } from '@/app/hooks/useGoals'
import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from '@/app/validators/profile.schema'
import { formatCurrency, getInitials } from '@/app/utils/formatters'
import { useAuthStore } from '@/app/stores/auth.store'

function ProfileForm({ onCancel }: { onCancel: () => void }) {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      birth_date: profile?.birth_date ?? '',
      location: profile?.location ?? '',
    },
  })

  async function onSubmit(data: ProfileInput) {
    await updateProfile.mutateAsync(data)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nome completo</span>
          </label>
          <input
            {...register('full_name')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefone</span>
          </label>
          <input
            {...register('phone')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="+55 11 99999-9999"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Data de nascimento</span>
          </label>
          <input
            {...register('birth_date')}
            type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Localização</span>
          </label>
          <input
            {...register('location')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Ex: São Paulo, SP"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
          <X className="w-4 h-4" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

function PasswordSection() {
  const changePassword = useChangePassword()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(data: ChangePasswordInput) {
    await changePassword.mutateAsync(data.newPassword)
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <Lock className="w-4 h-4" /> Alterar senha
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Lock className="w-4 h-4" /> Alterar senha</p>
      {(['currentPassword', 'newPassword', 'confirmNewPassword'] as const).map((field) => (
        <div key={field}>
          <input
            {...register(field)}
            type="password"
            autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={field === 'currentPassword' ? 'Senha atual' : field === 'newPassword' ? 'Nova senha' : 'Confirmar nova senha'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]?.message}</p>}
        </div>
      ))}
      <div className="flex gap-3">
        <button type="button" onClick={() => { setOpen(false); reset() }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={changePassword.isPending} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
          {changePassword.isPending ? 'Salvando...' : 'Salvar senha'}
        </button>
      </div>
    </form>
  )
}

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { profile, user } = useAuthStore()
  const { data: profileData } = useProfile()
  const uploadAvatar = useUploadAvatar()
  const { data: transactionsData } = useTransactions({ pageSize: 1 })
  const { data: goals } = useGoals()

  const displayProfile = profileData ?? profile
  const initials = getInitials(displayProfile?.full_name ?? 'U')
  const activeGoals = (goals ?? []).filter((g) => g.status === 'active').length
  const totalSaved = (goals ?? []).reduce((s, g) => s + g.current_amount, 0)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAvatar.mutate(file)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Avatar + name card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {displayProfile?.avatar_url ? (
                <img src={displayProfile.avatar_url} alt={displayProfile.full_name} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">{displayProfile?.full_name ?? '—'}</h2>
            <p className="text-sm text-gray-500 mb-3">{user?.email ?? '—'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full capitalize">
                {displayProfile?.plan ?? 'free'}
              </span>
              {displayProfile?.location && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{displayProfile.location}
                </span>
              )}
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{transactionsData?.count ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Transações</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{activeGoals}</p>
          <p className="text-xs text-gray-500 mt-1">Metas ativas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalSaved)}</p>
          <p className="text-xs text-gray-500 mt-1">Economizado</p>
        </div>
      </div>

      {/* Edit form / profile details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-4">Informações pessoais</h3>
        {editing ? (
          <ProfileForm onCancel={() => setEditing(false)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Nome', value: displayProfile?.full_name, icon: User },
              { label: 'Telefone', value: displayProfile?.phone, icon: Phone },
              { label: 'Nascimento', value: displayProfile?.birth_date, icon: Calendar },
              { label: 'Localização', value: displayProfile?.location, icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Icon className="w-3 h-3" />{label}</p>
                <p className="text-gray-800 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">Segurança</h3>
        <PasswordSection />
      </div>
    </div>
  )
}
