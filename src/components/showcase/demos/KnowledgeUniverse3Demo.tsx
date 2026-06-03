'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface CategoryData {
  name: string
  color: string
  children: string[]
}

const CATEGORY_DATA: CategoryData[] = [
  {
    name: '基础知识',
    color: '#ff5c7a',
    children: ['法理学', '民法', '刑法', '行政法', '法治思想', '法律文书'],
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
    color: '#aab5c5',
    children: ['模拟立法', '公共决策', '政策评估'],
  },
]

/**
 * 知识宇宙 III (源自 preview (3).html)
 * 星云背景 + 分类公转 + hover 聚焦
 */
export default function KnowledgeUniverse3Demo() {
  const mountRef = useRef<HTMLDivElement>(null)
  const starsContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const nodesRef = useRef<any[]>([])
  const linksRef = useRef<any[]>([])

  useEffect(() => {
    // DOM 星空
    const starsEl = starsContainerRef.current
    if (starsEl) {
      starsEl.innerHTML = ''
      for (let i = 0; i < 400; i++) {
        const star = document.createElement('div')
        const size = Math.random() * 3
        star.style.position = 'fixed'
        star.style.left = Math.random() * 100 + 'vw'
        star.style.top = Math.random() * 100 + 'vh'
        star.style.width = size + 'px'
        star.style.height = size + 'px'
        star.style.borderRadius = '50%'
        star.style.background = 'white'
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

    const nodes: any[] = []
    const links: any[] = []

    nodes.push({
      id: 'center',
      name: 'LAW\nAI',
      x: 0,
      y: 0,
      fixed: true,
      symbol: 'diamond',
      symbolSize: 160,
      itemStyle: {
        color: '#ffffff',
        borderColor: '#6ed7ff',
        borderWidth: 4,
        shadowBlur: 120,
        shadowColor: '#42cfff',
      },
      label: {
        show: true,
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 38,
        textShadowBlur: 30,
        textShadowColor: '#42cfff',
      },
    })

    const categoryRadius = 400
    CATEGORY_DATA.forEach((cat, index) => {
      const angle = (Math.PI * 2) / CATEGORY_DATA.length * index
      const x = Math.cos(angle) * categoryRadius
      const y = Math.sin(angle) * categoryRadius

      nodes.push({
        id: cat.name,
        name: cat.name,
        x,
        y,
        orbitAngle: angle,
        symbolSize: 82,
        draggable: true,
        itemStyle: {
          color: cat.color,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 60,
          shadowColor: cat.color,
        },
        label: {
          show: true,
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          textShadowBlur: 15,
          textShadowColor: cat.color,
        },
      })

      links.push({
        source: 'center',
        target: cat.name,
        lineStyle: { color: cat.color, width: 3, opacity: 0.8 },
      })

      cat.children.forEach((child, i) => {
        const childAngle = angle + (i - cat.children.length / 2) * 0.25
        const r = 700
        const sx = Math.cos(childAngle) * r
        const sy = Math.sin(childAngle) * r
        nodes.push({
          id: child,
          name: child,
          parent: cat.name,
          x: sx,
          y: sy,
          orbitAngle: childAngle,
          symbolSize: 30,
          draggable: true,
          itemStyle: {
            color: cat.color,
            borderColor: '#fff',
            borderWidth: 1,
            shadowBlur: 25,
            shadowColor: cat.color,
          },
          label: {
            show: true,
            color: '#dce8ff',
            fontSize: 14,
            textShadowBlur: 8,
            textShadowColor: cat.color,
          },
        })
        links.push({
          source: cat.name,
          target: child,
          lineStyle: { color: cat.color, width: 1.5, opacity: 0.45 },
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
          center: ['50%', '50%'],
          zoom: 1,
          scaleLimit: { min: 0.3, max: 5 },
          data: nodes,
          links: links,
          lineStyle: { curveness: 0.2, opacity: 0.8 },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 6 },
          },
          label: { position: 'right' },
        },
      ],
    }

    chart.setOption(option)

    nodesRef.current = nodes
    linksRef.current = links

    // 呼吸 + 公转
    let t = 0
    const animate = setInterval(() => {
      t += 0.01

      // 呼吸
      nodesRef.current.forEach((node, index) => {
        if (node.id === 'center') {
          node.symbolSize = 160 + Math.sin(t * 4) * 10
        } else {
          const base = node.symbolSize > 50 ? 82 : 30
          node.symbolSize = base + Math.sin(t * 3 + index) * 1.5
        }
      })

      // 分类公转
      nodesRef.current.forEach((node) => {
        if (node.orbitAngle !== undefined && node.symbolSize > 50) {
          node.orbitAngle += 0.001
          node.x = Math.cos(node.orbitAngle) * categoryRadius
          node.y = Math.sin(node.orbitAngle) * categoryRadius
        }
      })

      // 子节点跟随旋转
      CATEGORY_DATA.forEach((cat) => {
        cat.children.forEach((child) => {
          const node = nodesRef.current.find((n) => n.id === child)
          if (node) {
            node.orbitAngle += 0.001
            const r = 700
            node.x = Math.cos(node.orbitAngle) * r
            node.y = Math.sin(node.orbitAngle) * r
          }
        })
      })

      chart.setOption({
        series: [{ data: nodesRef.current }],
      })
    }, 16)

    // 流光
    let offset = 0
    const flow = setInterval(() => {
      offset++
      linksRef.current.forEach((link) => {
        link.lineStyle.type = [12, 12]
        link.lineStyle.dashOffset = -offset
      })
      chart.setOption({
        series: [{ links: linksRef.current }],
      })
    }, 80)

    // hover 聚焦
    const onMouseOver = (params: any) => {
      const current = params.data.id
      const connected = new Set<string>()
      linksRef.current.forEach((link) => {
        if (link.source === current || link.target === current) {
          connected.add(typeof link.source === 'string' ? link.source : link.source.id)
          connected.add(typeof link.target === 'string' ? link.target : link.target.id)
        }
      })
      nodesRef.current.forEach((node) => {
        if (node.id === current || connected.has(node.id)) {
          node.itemStyle.opacity = 1
        } else {
          node.itemStyle.opacity = 0.08
        }
      })
      chart.setOption({ series: [{ data: nodesRef.current }] })
    }
    const onMouseOut = () => {
      nodesRef.current.forEach((node) => {
        node.itemStyle.opacity = 1
      })
      chart.setOption({ series: [{ data: nodesRef.current }] })
    }
    chart.on('mouseover', onMouseOver)
    chart.on('mouseout', onMouseOut)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(animate)
      clearInterval(flow)
      chart.off('mouseover', onMouseOver)
      chart.off('mouseout', onMouseOut)
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [])

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, #0d1b2f 0%, #040914 45%, #000000 100%)',
      }}
    >
      {/* 星云 */}
      <div
        className="ku3-nebula"
        style={{
          position: 'fixed',
          left: '-200px',
          top: '-200px',
          width: '1200px',
          height: '1200px',
          borderRadius: '50%',
          background: '#1d5eff',
          filter: 'blur(120px)',
          opacity: 0.18,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          animation: 'ku3-float1 18s ease-in-out infinite',
        }}
      />
      <div
        className="ku3-nebula"
        style={{
          position: 'fixed',
          right: '-300px',
          bottom: '-300px',
          width: '1200px',
          height: '1200px',
          borderRadius: '50%',
          background: '#ff5ca8',
          filter: 'blur(120px)',
          opacity: 0.18,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          animation: 'ku3-float2 22s ease-in-out infinite',
        }}
      />
      <div
        className="ku3-nebula"
        style={{
          position: 'fixed',
          left: '40%',
          top: '20%',
          width: '1200px',
          height: '1200px',
          borderRadius: '50%',
          background: '#42cfff',
          filter: 'blur(120px)',
          opacity: 0.18,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          animation: 'ku3-float3 26s ease-in-out infinite',
        }}
      />

      <div ref={starsContainerRef} />

      <div className="ku3-hud fixed left-6 top-6 z-10 font-sans">
        <h1
          className="text-[34px] font-light tracking-[3px] text-[#6ed7ff]"
          style={{ textShadow: '0 0 10px #42cfff, 0 0 25px #42cfff, 0 0 60px #42cfff' }}
        >
          KNOWLEDGE UNIVERSE
        </h1>
        <p className="mt-2 text-xs tracking-[3px] text-[#90a7c7]">NEURAL COSMOS SYSTEM</p>
      </div>

      <div ref={mountRef} className="relative z-[1] h-full w-full" />

      <style jsx global>{`
        @keyframes ku3-float1 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(120px, 80px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes ku3-float2 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-150px, -120px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes ku3-float3 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(100px, -100px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  )
}
