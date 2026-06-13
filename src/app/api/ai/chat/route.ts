import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { decryptKey } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return new Response('未登录', { status: 401 })

    const body = await request.json()
    const { messages, sessionId, deepThinking } = body

    if (!messages || !Array.isArray(messages) || !sessionId) {
      return new Response('参数错误', { status: 400 })
    }

    const config = await prisma.aiConfig.findUnique({ where: { userId: session.id } })
    if (!config) return new Response('请先配置 AI API Key', { status: 400 })

    const apiKey = decryptKey(config.encryptedApiKey, config.encryptionIV)
    const endpoint = config.apiEndpoint.replace(/\/$/, '')

    const systemPrompt = deepThinking
      ? '你是一个深度思考的AI助手。请在回答前进行详细的推理和分析，使用 <thinking> 标签包裹你的思考过程。'
      : '你是一个有帮助的AI助手。'

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.provider === 'deepseek' ? 'deepseek-chat' : config.provider === 'openai' ? 'gpt-4o-mini' : 'chat',
        messages: apiMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(`AI API 错误: ${errorText}`, { status: response.status })
    }

    const encoder = new TextEncoder()
    let fullContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (!trimmed.startsWith('data: ')) continue

              try {
                const json = JSON.parse(trimmed.slice(6))
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  fullContent += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }

          // Save assistant message to DB
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: fullContent,
            },
          })

          // Update session title from first user message if still default
          const sessionData = await prisma.chatSession.findUnique({ where: { id: sessionId } })
          if (sessionData?.title === '新对话') {
            const firstMsg = messages.find((m: { role: string }) => m.role === 'user')
            if (firstMsg) {
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { title: firstMsg.content.slice(0, 40) },
              })
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response('服务器错误', { status: 500 })
  }
}
