'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Check, Loader2, Zap } from 'lucide-react'

const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    description: 'DeepSeek API — 高性价比中文 AI',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    description: 'OpenAI GPT 系列 API',
  },
  {
    id: 'custom',
    name: '自定义',
    endpoint: '',
    description: '兼容 OpenAI 格式的自定义端点',
  },
]

export default function AiSettingsPage() {
  const [provider, setProvider] = useState('deepseek')
  const [apiEndpoint, setApiEndpoint] = useState('https://api.deepseek.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/ai/config')
        if (res.ok) {
          const data = await res.json()
          if (data.provider) setProvider(data.provider)
          if (data.apiEndpoint) setApiEndpoint(data.apiEndpoint)
          if (data.hasKey) setHasExistingKey(true)
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleProviderChange = (id: string) => {
    setProvider(id)
    const preset = PROVIDERS.find((p) => p.id === id)
    if (preset && id !== 'custom') {
      setApiEndpoint(preset.endpoint)
    }
  }

  const handleSave = async () => {
    if (!apiKey && !hasExistingKey) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiEndpoint,
          apiKey: apiKey || 'KEEP_EXISTING',
        }),
      })
      if (res.ok) {
        setSaved(true)
        setHasExistingKey(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      // Save first, then test
      if (apiKey) {
        await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiEndpoint, apiKey }),
        })
      }

      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '连接测试' }),
      })
      const session = await res.json()

      const chatRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '你好，请用一句话回复' }],
          sessionId: session.id,
          deepThinking: false,
        }),
      })

      if (chatRes.ok) {
        setTestResult('success')
      } else {
        setTestResult(`失败: ${await chatRes.text()}`)
      }

      // Clean up test session
      await fetch(`/api/ai/sessions?id=${session.id}`, { method: 'DELETE' })
    } catch {
      setTestResult('网络错误')
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="content-wrapper py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[var(--neon-blue)]" />
            </div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
            >
              AI 配置
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            配置你的 AI API 密钥以启用 AI 对话功能。密钥将加密存储在数据库中。
          </p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">AI 提供商</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  provider === p.id
                    ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.06)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[rgba(20,20,28,0.4)] hover:border-[rgba(255,255,255,0.1)]'
                }`}
              >
                <div className="font-semibold text-sm text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Endpoint */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">API Endpoint</label>
          <input
            type="url"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(20,20,28,0.6)] border border-[rgba(255,255,255,0.06)] text-foreground text-sm outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors"
          />
        </div>

        {/* API Key */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasExistingKey ? '留空保留当前密钥' : '输入你的 API Key'}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-[rgba(20,20,28,0.6)] border border-[rgba(255,255,255,0.06)] text-foreground text-sm outline-none focus:border-[rgba(0,212,255,0.3)] transition-colors font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-muted-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {hasExistingKey && (
            <p className="text-xs text-muted-foreground">
              已保存密钥。输入新密钥可覆盖，留空则保留当前密钥。
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || (!apiKey && !hasExistingKey)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--neon-blue)] to-[#0099cc] text-black text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saved ? '已保存' : '保存配置'}
          </button>

          <button
            onClick={handleTest}
            disabled={isTesting || !hasExistingKey}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-foreground text-sm font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all disabled:opacity-40"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            测试连接
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-xl text-sm ${
              testResult === 'success'
                ? 'bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.2)] text-[#34c759]'
                : 'bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.2)] text-[#ff3b30]'
            }`}
          >
            {testResult === 'success' ? '连接成功！AI 服务运行正常。' : testResult}
          </div>
        )}

        {/* Success Toast */}
        {saved && (
          <div className="fixed bottom-6 right-6 px-5 py-3 rounded-xl bg-[rgba(52,199,89,0.12)] border border-[rgba(52,199,89,0.2)] text-[#34c759] text-sm font-medium animate-[dropdownFadeIn_0.2s_ease]">
            配置已保存
          </div>
        )}
      </div>
    </div>
  )
}
