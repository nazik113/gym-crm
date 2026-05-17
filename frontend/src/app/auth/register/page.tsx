'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth'
import { Dumbbell, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'

const codeSchema = z.object({ code: z.string().min(6, 'Enter a valid code') })
type CodeForm = z.infer<typeof codeSchema>

const registerSchema = z.object({
  phone: z.string().min(7),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().optional(),
  password: z.string().min(6),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, { message: 'Passwords must match', path: ['password_confirmation'] })
type RegisterForm = z.infer<typeof registerSchema>

type Step = 'code' | 'register'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [step, setStep] = useState<Step>('code')
  const [validCode, setValidCode] = useState('')
  const [codeRole, setCodeRole] = useState('')
  const [loading, setLoading] = useState(false)

  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })
  const regForm  = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onValidateCode = async ({ code }: CodeForm) => {
    try {
      setLoading(true)
      const res = await authApi.validateCode(code)
      setValidCode(code)
      setCodeRole(res.data.role)
      setStep('register')
      toast.success('Code verified! Complete your registration.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: any) => {
    try {
      setLoading(true)
      const res = await authApi.register({ ...data, code: validCode })
      setAuth(res.data.user, res.data.token)
      toast.success('Account created successfully!')
      router.replace('/client/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"

  return (
    <div className="min-h-screen bg-graphite-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">GymCRM</h1>
            <p className="text-muted-foreground text-sm">
              {step === 'code' ? 'Enter your invitation code' : 'Complete your profile'}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {(['code', 'register'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step === s ? 'bg-purple-500' : step === 'register' && i === 0 ? 'bg-green-500' : 'bg-graphite-600'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'code' && (
            <motion.form key="code" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              onSubmit={codeForm.handleSubmit(onValidateCode)} className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Invitation Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input {...codeForm.register('code')} placeholder="XXXXXXXXXX" className={`${inputClass} pl-10 uppercase tracking-widest font-mono`} />
                </div>
                {codeForm.formState.errors.code && <p className="text-destructive text-xs">{codeForm.formState.errors.code.message}</p>}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-purple-500 hover:to-cyan-500 transition-all disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify Code'}
              </motion.button>
            </motion.form>
          )}

          {step === 'register' && (
            <motion.form key="register" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              onSubmit={regForm.handleSubmit(onRegister)} className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">First Name</label>
                  <input {...regForm.register('first_name')} placeholder="John" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <input {...regForm.register('last_name')} placeholder="Doe" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <input {...regForm.register('phone')} type="tel" placeholder="+1 234 567 8900" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                <input {...regForm.register('date_of_birth')} type="date" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <input {...regForm.register('password')} type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
                <input {...regForm.register('password_confirmation')} type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-purple-500 hover:to-cyan-500 transition-all disabled:opacity-60 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
            Already have an account? <span className="text-purple-400 font-medium">Sign in</span>
          </a>
        </div>
      </motion.div>
    </div>
  )
}
