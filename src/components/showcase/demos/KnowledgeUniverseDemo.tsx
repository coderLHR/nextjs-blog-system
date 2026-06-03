'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface CategoryData {
  name: string
  color: string
  children: string[]
}

interface GNode {
  id: string
  name: string
  x?: number
  y?: number
  symbol?: string
  symbolSize?: number
  fixed?: boolean
  draggable?: boolean
  itemStyle?: Record<string, unknown>
  label?: Record<string, unknown>
}

interface GLink {
  source: string
  target: string
  lineStyle: Record<string, unknown>
}

const CATEGORY_DATA: CategoryData[] = [
  {
    name: '基础知识',
    color: '#ff5c7a',
    children: ['法理学', '民法', '刑法', '行政法', '法治思想', '职业伦理'],
  },
  {
    name: '核心知识',
    color: '#42a5ff',
    children: ['企业法务', '公司治理', '涉外法律', '商事纠纷', '刑事风险'],
  },
  {
    name: '拓展知识',
    color: '#ffb347',
    children: ['人工智能', '大数据', '网络安全', '法律科技', '金融', '税务', '会计学'],
  },
  {
    name: '潜在知识',
    color: '#a8b2c2',
    children: ['模拟立法', '公共决策', '政策评估'],
  },
]

/**
 * 知识宇宙 II (源自 preview (2).html)
 * DOM 星空 + ECharts 主体图谱
 */
export default function KnowledgeUniverseDemo() {
  const mountRef = useRef<HTMLDivElement>(null)
  const starsContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const nodesRef = useRef<GNode[]>([])

  useEffect(() => {
    // 创建 DOM 星空
    const starsEl = starsContainerRef.current
    if (starsEl) {
      starsEl.innerHTML = ''
      for (let i = 0; i < 260; i++) {
        const star = document.createElement('div')
        const size = Math.random() * 3
        star.style.position = 'fixed'
        star.style.width = size + 'px'
        star.style.height = size + 'px'
        star.style.borderRadius = '50%'
        star.style.background = 'white'
        star.style.left = Math.random() * 100 + 'vw'
        star.style.top = Math.random() * 100 + 'vh'
        star.style.opacity = String(Math.random())
        star.style.boxShadow = '0 0 10px white'
        star.style.pointerEvents = 'none'
        star.style.zIndex = '0'
        starsEl.appendChild(star)
      }
    }

    if (!mountRef.current) return
    const chart = echarts.init(mountRef.current)
    chartRef.current = chart

    const nodes: GNode[] = []
    const links: GLink[] = []

    // 中心核心
    nodes.push({
      id: 'center',
      name: 'LAW\nAI',
      x: 0,
      y: 0,
      symbol: 'diamond',
      symbolSize: 140,
      fixed: true,
      itemStyle: {
        color: '#fff',
        borderColor: '#69d4ff',
        borderWidth: 4,
        shadowBlur: 80,
        shadowColor: '#42cfff',
      },
      label: {
        show: true,
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 34,
        textShadowBlur: 20,
        textShadowColor: '#42cfff',
      },
    })

    const categoryRadius = 350
    CATEGORY_DATA.forEach((cat, index) => {
      const angle = (Math.PI * 2) / CATEGORY_DATA.length * index
      const x = Math.cos(angle) * categoryRadius
      const y = Math.sin(angle) * categoryRadius

      nodes.push({
        id: cat.name,
        name: cat.name,
        x,
        y,
        symbolSize: 70,
        draggable: true,
        itemStyle: {
          color: cat.color,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 40,
          shadowColor: cat.color,
        },
        label: {
          show: true,
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          textShadowBlur: 10,
          textShadowColor: cat.color,
        },
      })

      links.push({
        source: 'center',
        target: cat.name,
        lineStyle: { color: cat.color, width: 3, opacity: 0.8 },
      })

      cat.children.forEach((child, i) => {
        const childAngle = angle + ((i - cat.children.length / 2) * 0.22)
        const r = 620
        const sx = Math.cos(childAngle) * r
        const sy = Math.sin(childAngle) * r
        nodes.push({
          id: child,
          name: child,
          x: sx,
          y: sy,
          symbolSize: 28,
          draggable: true,
          itemStyle: {
            color: cat.color,
            borderColor: '#fff',
            borderWidth: 1,
            shadowBlur: 20,
            shadowColor: cat.color,
          },
          label: {
            show: true,
            position: 'right',
            color: '#d8e7ff',
            fontSize: 14,
          },
        })
        links.push({
          source: cat.name,
          target: child,
          lineStyle: { color: cat.color, width: 1.5, opacity: 0.4 },
        })
      })
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderColor: '#42cfff',
        textStyle: { color: '#fff' },
      },
      animationDuration: 2000,
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          draggable: true,
          center: ['50%', '50%'],
          zoom: 1,
          scaleLimit: { min: 0.3, max: 4 },
          data: nodes,
          links: links,
          lineStyle: { curveness: 0.2, opacity: 0.7 },
          emphasis: {
            focus: 'adjacency',
            scale: true,
            lineStyle: { width: 6 },
          },
          label: { position: 'right' },
          edgeSymbol: ['none', 'none'],
          edgeLabel: { show: false },
        },
      ],
    }

    chart.setOption(option)
    nodesRef.current = nodes

    // 呼吸
    let t = 0
    const breathing = setInterval(() => {
      t += 0.05
      nodesRef.current.forEach((node, index) => {
        if (node.id === 'center') {
          node.symbolSize = 140 + Math.sin(t) * 8
        } else {
          const base = (node.symbolSize ?? 28) > 50 ? 70 : 28
          node.symbolSize = base + Math.sin(t + index) * 1.5
        }
      })
      chart.setOption({
        series: [{ data: nodesRef.current }],
      })
    }, 60)

    // 流光
    let offset = 0
    const flow = setInterval(() => {
      offset++
      links.forEach((link) => {
        link.lineStyle.type = [10, 10]
        link.lineStyle.dashOffset = -offset
      })
      chart.setOption({
        series: [{ links }],
      })
    }, 100)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(breathing)
      clearInterval(flow)
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [])

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, #07111f 0%, #02050b 55%, #000 100%)',
      }}
    >
      <div ref={starsContainerRef} />
      <div className="ku2-hud fixed left-6 top-5 z-10 text-[#69d4ff] font-sans tracking-[2px]">
        <h1 className="text-[30px] font-light" style={{ textShadow: '0 0 10px #42cfff, 0 0 30px #42cfff' }}>
          KNOWLEDGE UNIVERSE
        </h1>
        <p className="mt-1.5 text-xs text-[#8ca7c5] tracking-[2px]">SCI-FI NEBULA GRAPH SYSTEM</p>
      </div>
      <div ref={mountRef} className="relative z-[1] h-full w-full" />
    </div>
  )
}
