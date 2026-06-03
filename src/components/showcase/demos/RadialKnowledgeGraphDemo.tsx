'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface TreeDatum {
  name: string
  category?: string
  inheritedCategory?: string
  children?: TreeDatum[]
}

const TREE_DATA: TreeDatum = {
  name: '知识中枢',
  children: [
    {
      name: '核心知识',
      category: 'core',
      children: [
        { name: '1 司法结构与公司治理' },
        {
          name: '2 涉企民商事法律业务',
          children: [
            { name: '2.1 涉企民事责任一般原理' },
            { name: '2.2 典型的涉企民商事法律问题' },
            { name: '2.3 涉企民商事纠纷解决方法' },
          ],
        },
        { name: '3 涉企刑事法律业务' },
        { name: '4 涉企行政法律业务' },
        { name: '5 涉企涉外法律业务' },
        { name: '6 金融知识' },
      ],
    },
    {
      name: '基础知识',
      category: 'basic',
      children: [
        { name: '1 政治素养与法治思想' },
        { name: '2 基础法律知识' },
        { name: '3 基础法律理论知识' },
        { name: '4 基础法律职业知识' },
        { name: '5 法学方法论' },
        { name: '6 基础通识知识' },
        { name: '7 基本沟通与交流知识' },
      ],
    },
    {
      name: '拓展知识',
      category: 'expand',
      children: [
        { name: '1 跨学科和交叉学科知识' },
        { name: '2 法律信息技术知识' },
        {
          name: '3 会计学知识',
          children: [
            { name: '3.1 会计基础理论' },
            { name: '3.2 复式记账法' },
            { name: '3.3 企业经济业务核算' },
            { name: '3.4 资产负债表' },
          ],
        },
        { name: '4 税收管理知识' },
        { name: '5 工商管理知识' },
      ],
    },
    {
      name: '潜在知识',
      category: 'potential',
      children: [
        { name: '1 立法与政策制定知识' },
        { name: '2 法律业务创新管理知识' },
      ],
    },
  ],
}

const COLOR_MAP: Record<string, string> = {
  core: '#3b6291',
  basic: '#943126',
  expand: '#d35400',
  potential: '#aaaaaa',
}

/**
 * 放射状知识图谱 (源自 gemini-code-1778837015837)
 * D3 树形径向布局，支持缩放拖拽
 */
export default function RadialKnowledgeGraphDemo() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight
    const radius = Math.min(width, height) / 2 - 150

    const svg = d3
      .select(mount)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#050505')

    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1))

    const tree = d3
      .tree<TreeDatum>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / (a.depth || 1))

    const root = d3.hierarchy<TreeDatum>(TREE_DATA)
    tree(root)

    root.each((d) => {
      if (d.depth === 1) d.data.inheritedCategory = d.data.category
      else if (d.depth && d.depth > 1)
        d.data.inheritedCategory = d.parent?.data.inheritedCategory
    })

    const getColor = (category?: string) => {
      if (category === 'core') return COLOR_MAP.core
      if (category === 'basic') return COLOR_MAP.basic
      if (category === 'expand') return COLOR_MAP.expand
      if (category === 'potential') return COLOR_MAP.potential
      return '#999'
    }

    g.append('g')
      .attr('class', 'rkg-links')
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr(
        'd',
        d3
          .linkRadial<d3.HierarchyPointLink<TreeDatum>, d3.HierarchyPointNode<TreeDatum>>()
          .angle((d) => d.x)
          .radius((d) => d.y) as any
      )

    const node = g
      .append('g')
      .attr('class', 'rkg-nodes')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('class', 'rkg-node')
      .attr('transform', (d) => {
        const angle = ((d.x ?? 0) * 180) / Math.PI - 90
        const r = d.y ?? 0
        return `rotate(${angle}) translate(${r},0)`
      })

    node
      .append('circle')
      .attr('r', (d) => (d.depth === 0 ? 10 : d.depth === 1 ? 25 : 4))
      .attr('fill', (d) => getColor(d.data.inheritedCategory))

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (d) =>
        (d.x ?? 0) < Math.PI === !d.children ? 6 : -6
      )
      .attr('text-anchor', (d) =>
        (d.x ?? 0) < Math.PI === !d.children ? 'start' : 'end'
      )
      .attr('transform', (d) => ((d.x ?? 0) >= Math.PI ? 'rotate(180)' : null))
      .text((d) => d.data.name)
      .style('fill', (d) =>
        d.depth === 1 ? '#fff' : d.depth === 0 ? '#000' : '#ccc'
      )
      .style('font-weight', (d) => (d.depth === 1 ? 'bold' : 'normal'))
      .style('font-size', '12px')

    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      svg.attr('width', w).attr('height', h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      svg.remove()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="relative h-full w-full overflow-hidden bg-[#050505]"
      style={{ fontFamily: '"Microsoft YaHei", sans-serif' }}
    />
  )
}
