'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { getSession, verifyCredentials, createSession, deleteSession } from './session'
import bcrypt from 'bcryptjs'

// ==============================
// Auth Actions
// ==============================

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await verifyCredentials(email, password)
  if (!user) {
    return { error: '邮箱或密码错误' }
  }

  await createSession(user)
  redirect('/blog')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return { error: '邮箱已存在' }
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  })

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  redirect('/blog')
}

export async function logout() {
  await deleteSession()
  redirect('/')
}

// ==============================
// Post Actions
// ==============================

export async function getPosts({ published = true, limit = 10 } = {}) {
  return prisma.post.findMany({
    where: published ? { published: true } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: { select: { name: true, email: true } } },
  })
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true, email: true } } },
  })
}

export async function createPost(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const published = formData.get('published') === 'on'
  const slug = formData.get('slug') as string || title.toLowerCase().replace(/\s+/g, '-')

  await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200),
      published,
      authorId: session.id,
    },
  })

  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  redirect('/blog')
}

export async function updatePost(id: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post || (post.authorId !== session.id && session.role !== 'admin')) {
    throw new Error('无权限')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const published = formData.get('published') === 'on'

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      excerpt: excerpt || content.slice(0, 200),
      published,
    },
  })

  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  redirect('/blog')
}

export async function deletePost(id: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post || (post.authorId !== session.id && session.role !== 'admin')) {
    throw new Error('无权限')
  }

  await prisma.post.delete({ where: { id } })
  revalidatePath('/blog')
  redirect('/blog')
}

export async function incrementViews(slug: string) {
  await prisma.post.update({
    where: { slug },
    data: { views: { increment: 1 } },
  })
}
