import { useState } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { BookOpenCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

type Step = 'email' | 'verify' | 'company' | 'admin'

interface FormState {
  email: string
  verificationToken: string
  companyName: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  logoUrl: string
  adminFirstName: string
  adminLastName: string
  adminPhone: string
  password: string
  confirmPassword: string
}

const STEPS: Step[] = ['email', 'verify', 'company', 'admin']
const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE ?? 'CRLG'
const IDS_LOGIN_UI_URL = process.env.NEXT_PUBLIC_IDS_LOGIN_UI_URL ?? 'http://localhost:3000'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('email')
  const [form, setForm] = useState<FormState>({
    email: '',
    verificationToken: '',
    companyName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    logoUrl: '',
    adminFirstName: '',
    adminLastName: '',
    adminPhone: '',
    password: '',
    confirmPassword: '',
  })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const stepIndex = STEPS.indexOf(step)

  // ─── Step 1: Email ──────────────────────────────────────────────────────────

  async function sendCode(isResend = false) {
    if (!form.email) return setError('Please enter your email address.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError('Please enter a valid email address.')

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboard/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })

      if (res.status === 429) {
        const data = await res.json()
        return setError(data.message ?? 'Please wait before requesting another code.')
      }

      if (!res.ok) throw new Error()

      setCodeSent(true)
      if (!isResend) setStep('verify')

      // 60-second cooldown
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Verify ─────────────────────────────────────────────────────────

  async function verifyCode() {
    if (otp.length < 6) return setError('Please enter the 6-digit code.')

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboard/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: otp }),
      })

      const data = await res.json().catch(() => null)

      if (res.status === 429) return setError('Too many attempts. Please request a new code.')
      if (!res.ok) return setError(data?.message ?? 'Invalid or expired code.')

      setForm(prev => ({ ...prev, verificationToken: data.verificationToken }))
      setStep('company')
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 3: Company ────────────────────────────────────────────────────────

  function validateCompany() {
    if (!form.companyName.trim()) return 'Company name is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!form.street.trim()) return 'Street is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.state.trim()) return 'State is required.'
    if (!form.postalCode.trim()) return 'Postal code is required.'
    if (!form.country.trim()) return 'Country is required.'
    return null
  }

  // ─── Step 4: Admin ──────────────────────────────────────────────────────────

  function validateAdmin() {
    if (!form.adminFirstName.trim()) return 'First name is required.'
    if (!form.adminLastName.trim()) return 'Last name is required.'
    if (!form.adminPhone.trim()) return 'Phone number is required.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  async function submitRegistration() {
    const adminErr = validateAdmin()
    if (adminErr) return setError(adminErr)

    setLoading(true)
    setError('')

    try {
      // 1. Create tenant on IDS
      const regRes = await fetch('/api/onboard/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken: form.verificationToken,
          name: form.companyName,
          email: form.email,
          phone: form.phone,
          street: form.street,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          logoUrl: form.logoUrl || undefined,
          productCode: PRODUCT_CODE,
          administrator: {
            firstName: form.adminFirstName,
            lastName: form.adminLastName,
            phoneNumber: form.adminPhone,
            password: form.password,
          },
        }),
      })

      const regData = await regRes.json().catch(() => null)
      if (!regRes.ok) return setError(regData?.message ?? 'Registration failed. Please try again.')

      const { ott } = regData as { ott: string }

      // 2. Initialize next-auth OIDC flow to get state + PKCE cookies
      //    (does NOT redirect — sets cookies and returns the IDS authorize URL)
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json() as { csrfToken: string }

      const signinRes = await fetch('/api/auth/signin/bechellente-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ callbackUrl: '/onboard/plans', csrfToken, json: 'true' }),
        credentials: 'include',
        redirect: 'manual',
      })

      // next-auth returns { url } — the IDS authorize URL
      const { url: idsAuthorizeUrl } = await signinRes.json() as { url: string }

      // Convert absolute IDS URL to identity-web proxy path (relative path keeps it on identity-web domain)
      const parsed = new URL(idsAuthorizeUrl)
      const authorizeUrl = parsed.pathname + parsed.search  // e.g., /connect/authorize?...

      // 3. Redirect to identity-web's auto-login — redeems OTT silently,
      //    establishes IDS session, and forwards to the OIDC authorize endpoint
      const autoLoginUrl = new URL('/auto-login', IDS_LOGIN_UI_URL)
      autoLoginUrl.searchParams.set('ott', ott)
      autoLoginUrl.searchParams.set('authorize_url', authorizeUrl)

      window.location.href = autoLoginUrl.toString()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Head><title>Create your account — CoreLedger</title></Head>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg bg-[var(--cl-primary)] flex items-center justify-center text-white shrink-0">
            <BookOpenCheck size={18} strokeWidth={2.2} />
          </div>
          <div className="text-[18px] tracking-tight leading-none select-none">
            <span className="font-semibold text-[#184F97]">Core</span>
            <span className="font-semibold text-[#004A7E]">Ledger</span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm px-8 py-10">

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`h-1 w-full rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-[var(--cl-primary)]' : 'bg-border'
                }`} />
              </div>
            ))}
          </div>

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold">Create your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Start with your work email address.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                  onKeyDown={e => e.key === 'Enter' && sendCode()}
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full"
                onClick={() => sendCode()}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Continue
                {!loading && <ArrowRight size={16} className="ml-2" />}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/auth/signin" className="text-[var(--cl-primary)] font-medium hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          )}

          {/* ── Step 2: Verify ── */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold">Check your inbox</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{form.email}</span>.
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button className="w-full" onClick={verifyCode} disabled={loading || otp.length < 6}>
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Verify email
                {!loading && <ArrowRight size={16} className="ml-2" />}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>
                  Didn't receive it?{' '}
                  <button
                    className="text-[var(--cl-primary)] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => sendCode(true)}
                    disabled={resendCooldown > 0 || loading}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </p>
                <button
                  className="text-muted-foreground hover:underline text-xs"
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Company ── */}
          {step === 'company' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-1">
                <CheckCircle2 size={15} />
                Email verified
              </div>
              <div>
                <h1 className="text-xl font-semibold">About your company</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us about the organization you're setting up.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name <span className="text-destructive">*</span></Label>
                  <Input id="companyName" placeholder="Acme Ltd" value={form.companyName} onChange={set('companyName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Company phone <span className="text-destructive">*</span></Label>
                  <Input id="phone" type="tel" placeholder="+44 20 7946 0958" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street <span className="text-destructive">*</span></Label>
                  <Input id="street" placeholder="15 Adeola Odeku Street" value={form.street} onChange={set('street')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input id="city" placeholder="Lagos" value={form.city} onChange={set('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Input id="state" placeholder="Lagos" value={form.state} onChange={set('state')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal code <span className="text-destructive">*</span></Label>
                    <Input id="postalCode" placeholder="101241" value={form.postalCode} onChange={set('postalCode')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                    <Input id="country" placeholder="Nigeria" value={form.country} onChange={set('country')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="logoUrl" type="url" placeholder="https://..." value={form.logoUrl} onChange={set('logoUrl')} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('verify')} className="flex-1">
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                <Button className="flex-1" onClick={() => {
                  const err = validateCompany()
                  if (err) return setError(err)
                  setError('')
                  setStep('admin')
                }}>
                  Continue <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Admin ── */}
          {step === 'admin' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold">Administrator account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  This will be the primary admin for{' '}
                  <span className="font-medium text-foreground">{form.companyName}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
                    <Input id="firstName" placeholder="John" value={form.adminFirstName} onChange={set('adminFirstName')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
                    <Input id="lastName" placeholder="Smith" value={form.adminLastName} onChange={set('adminLastName')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Phone <span className="text-destructive">*</span></Label>
                  <Input id="adminPhone" type="tel" placeholder="+44 7911 123456" value={form.adminPhone} onChange={set('adminPhone')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <Input id="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm password <span className="text-destructive">*</span></Label>
                  <Input id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('company')} disabled={loading} className="flex-1">
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                <Button className="flex-1" onClick={submitRegistration} disabled={loading}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating account…</>
                    : <>Create account <ArrowRight size={16} className="ml-2" /></>}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By creating an account you agree to our{' '}
                <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
