import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/blog')

  return (
    <div className="container max-w-md py-20">
      <div className="space-y-3 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">欢迎使用 NextBlog</h1>
        <p className="text-sm text-muted-foreground">默认账号: demo@example.com / demo123</p>
      </div>
      <LoginForm />
    </div>
  )
}
