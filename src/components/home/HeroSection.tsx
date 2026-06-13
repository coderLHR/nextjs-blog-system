'use client'

import { motion } from 'framer-motion'
import { StatsCounter } from './StatsCounter'
import { AiSearchBar } from './AiSearchBar'

interface HeroSectionProps {
  stats: {
    postCount: number
    totalViews: number
    userCount: number
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  const leftStats = [
    { value: stats.postCount, label: '文章数量' },
    { value: stats.userCount, label: '注册用户' },
  ]

  const rightStats = [
    { value: stats.totalViews, label: '总浏览量' },
    { value: stats.postCount * 850, label: '总字数', suffix: '+' },
  ]

  return (
    <section className="hero-section px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-center">
          {/* Left Stats */}
          <motion.div
            className="hidden lg:flex justify-end"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <StatsCounter items={leftStats} />
          </motion.div>

          {/* Center Content */}
          <motion.div
            className="text-center space-y-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="space-y-4">
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
              >
                <span className="text-foreground">Next</span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #00d4ff, #ff6b35)',
                  }}
                >
                  Blog
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                探索技术、分享思考、与 AI 对话
              </p>
            </div>

            <AiSearchBar />

            {/* Mobile Stats */}
            <div className="lg:hidden grid grid-cols-2 gap-4 pt-4">
              <div className="stats-card">
                <div className="stats-number">{stats.postCount}</div>
                <div className="stats-label">文章</div>
              </div>
              <div className="stats-card">
                <div className="stats-number">{stats.totalViews}</div>
                <div className="stats-label">浏览量</div>
              </div>
            </div>
          </motion.div>

          {/* Right Stats */}
          <motion.div
            className="hidden lg:flex justify-start"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <StatsCounter items={rightStats} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
