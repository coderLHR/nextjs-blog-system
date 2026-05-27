'use client'

import { useState } from 'react'
import { login, register } from '@/lib/actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function LoginForm() {
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')

  async function handleLogin(formData: FormData) {
    setLoginError('')
    const result = await login(formData)
    if (result?.error) setLoginError(result.error)
  }

  async function handleRegister(formData: FormData) {
    setRegisterError('')
    const result = await register(formData)
    if (result?.error) setRegisterError(result.error)
  }

  return (
    <div className="ios-card p-8">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2 mb-8 rounded-2xl h-12 bg-muted p-1">
          <TabsTrigger
            value="login"
            className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
          >
            登录
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
          >
            注册
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form action={handleLogin} className="space-y-5">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold tracking-tight">邮箱</label>
              <input
                name="email"
                type="email"
                defaultValue="demo@example.com"
                required
                className="w-full px-4 py-3 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-semibold tracking-tight">密码</label>
              <input
                name="password"
                type="password"
                defaultValue="demo123"
                required
                className="w-full px-4 py-3 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-xl px-4 py-3">{loginError}</p>
            )}
            <button
              type="submit"
              className="ios-btn ios-btn-primary w-full py-3.5 text-base font-semibold"
            >
              登录
            </button>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form action={handleRegister} className="space-y-5">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold tracking-tight">昵称</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-semibold tracking-tight">邮箱</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-semibold tracking-tight">密码</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            {registerError && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-xl px-4 py-3">{registerError}</p>
            )}
            <button
              type="submit"
              className="ios-btn ios-btn-primary w-full py-3.5 text-base font-semibold"
            >
              注册
            </button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
