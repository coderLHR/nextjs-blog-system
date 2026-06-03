'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface ModelNode {
  id: string
  name: string
  dimension: 'root' | 'quality' | 'ability' | 'knowledge' | 'core' | 'base' | 'expand'
  level: string
  details?: {
    definition?: string
    skills?: string
    learning_path?: string
  }
}

interface ModelLink {
  source: string
  target: string
}

const NODES: ModelNode[] = [
  { id: 'root', name: '法律职业', dimension: 'root', level: '核心需求' },
  { id: 'quality', name: '素质', dimension: 'quality', level: '维度首层' },
  { id: 'ability', name: '能力', dimension: 'ability', level: '维度首层' },
  { id: 'knowledge', name: '知识', dimension: 'knowledge', level: '维度首层' },
  { id: 'qual_base', name: '基础素质', dimension: 'quality', level: '层级 (素质)' },
  { id: 'qual_meta', name: '元认知素养', dimension: 'quality', level: '基础素质', details: { definition: '对自身思维和认知过程的意识和控制。对于法律从业者，这意味着自我反思、学习如何学习的能力。', skills: '自我监控、自我评估、学习策略选择、知识迁移。', learning_path: '案例教学中的自我反思、元认知日志、同行评审。' } },
  { id: 'qual_digital', name: '数字化素质', dimension: 'quality', level: '基础素质', details: { definition: '利用数字化工具和资源进行学习、研究、沟通和解决问题的能力。', skills: '法律检索工具、法律科技应用、数据分析基础、数字安全素养。', learning_path: '数字法律研究训练、法律科技工具工作坊、网络安全课程。' } },
  { id: 'qual_core', name: '核心素质', dimension: 'quality', level: '层级 (素质)' },
  { id: 'qual_intl', name: '国际化素养', dimension: 'quality', level: '核心素质', details: { definition: '理解不同法律体系、跨文化沟通以及在全球背景下处理法律问题的能力。', skills: '跨文化交流、外语法律能力、比较法思维、国际贸易规则理解。', learning_path: '比较法课程、模拟国际仲裁、海外研修项目。' } },
  { id: 'abil_base', name: '基础能力', dimension: 'ability', level: '层级 (能力)' },
  { id: 'abil_risk', name: '防控法律风险能力', dimension: 'ability', level: '基础能力', details: { definition: '识别、评估和缓解组织或个人可能面临的法律风险。', skills: '风险识别、合规审查、尽职调查、合规管理体系构建。', learning_path: '企业合规模拟、尽职调查训练、法律风险评估项目。' } },
  { id: 'abil_core', name: '核心能力', dimension: 'ability', level: '层级 (能力)' },
  { id: 'abil_solve', name: '解决法律争议能力', dimension: 'ability', level: '核心能力', details: { definition: '利用法律知识和程序通过谈判、调解、仲裁和诉讼等方式解决争议。', skills: '争议分析、谈判策略、庭审表达、法律文书写作。', learning_path: '模拟法庭、争议解决诊所、谈判技巧工作坊。' } },
  { id: 'abil_value', name: '整合商业价值', dimension: 'ability', level: '核心能力', details: { definition: '将法律分析与组织战略和商业目标相结合，提供具有商业现实感的建议。', skills: '商业思维、战略分析、跨部门沟通、财务基础知识。', learning_path: '商法综合案例、商业模拟竞赛、导师项目。' } },
  { id: 'abil_expand', name: '拓展能力', dimension: 'ability', level: '层级 (能力)' },
  { id: 'abil_rule', name: '规则制定能力', dimension: 'ability', level: '拓展能力', details: { definition: '起草、审查和修改合同、规章制度、立法草案，构建规范体系。', skills: '立法技术、合同起草、规章制度设计、逻辑构建。', learning_path: '合同起草实务、立法模拟、规章制度设计项目。' } },
  { id: 'know_base', name: '基础知识', dimension: 'knowledge', level: '层级 (知识)' },
  { id: 'know_theory', name: '基础法律理论知识', dimension: 'knowledge', level: '基础知识', details: { definition: '法理学、宪法、法律史等核心理论体系知识。', skills: '法律逻辑、规范分析、比较法研究。', learning_path: '法理学讲座、宪法研讨、经典法律著作阅读。' } },
  { id: 'know_expand', name: '拓展知识', dimension: 'knowledge', level: '层级 (知识)' },
  { id: 'know_finance', name: '金融财税知识', dimension: 'knowledge', level: '拓展知识', details: { definition: '理解金融市场、会计原则和税收法律，处理复杂的商业和财务法律问题。', skills: '财务报表分析、税收筹划基础、金融工具理解。', learning_path: '法学与金融双学位/辅修、财税法律诊所、会计基础课程。' } },
  { id: 'know_inter', name: '跨学科知识', dimension: 'knowledge', level: '拓展知识', details: { definition: '与法律相关的其他学科知识，如工商管理、心理学、社会学、数据科学等。', skills: '跨学科研究、综合分析、创新思维。', learning_path: '跨学科研究项目、选修课组合、导师项目。' } },
]

const LINKS: ModelLink[] = [
  { source: 'root', target: 'quality' },
  { source: 'root', target: 'ability' },
  { source: 'root', target: 'knowledge' },
  { source: 'quality', target: 'qual_base' },
  { source: 'quality', target: 'qual_core' },
  { source: 'qual_base', target: 'qual_meta' },
  { source: 'qual_base', target: 'qual_digital' },
  { source: 'qual_core', target: 'qual_intl' },
  { source: 'ability', target: 'abil_base' },
  { source: 'ability', target: 'abil_core' },
  { source: 'ability', target: 'abil_expand' },
  { source: 'abil_base', target: 'abil_risk' },
  { source: 'abil_core', target: 'abil_solve' },
  { source: 'abil_core', target: 'abil_value' },
  { source: 'abil_expand', target: 'abil_rule' },
  { source: 'knowledge', target: 'know_base' },
  { source: 'knowledge', target: 'know_expand' },
  { source: 'know_base', target: 'know_theory' },
  { source: 'know_expand', target: 'know_finance' },
  { source: 'know_expand', target: 'know_inter' },
]

const DIM_TEXT: Record<string, string> = {
  quality: '素质',
  ability: '能力',
  knowledge: '知识',
  root: '核心',
}

interface SimNode extends d3.SimulationNodeDatum, ModelNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode
  target: string | SimNode
}

/**
 * 法律职业能力模型 (源自 gemini-code-1778836693639)
 * D3 力导向图，点击节点显示详情面板
 */
export default function LegalAbilityModelDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [selected, setSelected] = useState<ModelNode | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(svgRef.current)

    const nodes: SimNode[] = NODES.map((d) => ({ ...d }))
    const links: SimLink[] = LINKS.map((d) => ({ ...d }))

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => ((d.source as SimNode).id === 'root' ? 150 : 80))
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const linkGroup = svg
      .select<SVGGElement>('.lam-links')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) =>
        (d.source as SimNode).id === 'root' ? 'none' : '3, 3'
      )

    const nodeGroup = svg
      .select<SVGGElement>('.lam-nodes')
      .selectAll<SVGCircleElement, SimNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) =>
        d.id === 'root' ? 25 : d.level === '维度首层' ? 15 : 10
      )
      .attr('fill', (d) => {
        if (d.dimension === 'root') return '#334155'
        if (d.dimension === 'quality') return '#10b981'
        if (d.dimension === 'ability') return '#3b82f6'
        if (d.dimension === 'knowledge') return '#f59e0b'
        return '#94a3b8'
      })
      .attr('stroke', (d) =>
        ['层级 (素质)', '层级 (能力)', '层级 (知识)'].includes(d.level)
          ? '#e2e8f0'
          : 'none'
      )
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => setSelected(d))
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    const labelGroup = svg
      .select<SVGGElement>('.lam-labels')
      .selectAll<SVGTextElement, SimNode>('text')
      .data(nodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', (d) => (d.id === 'root' ? 14 : 12))
      .attr('fill', '#0f172a')
      .attr('pointer-events', 'none')
      .attr('dx', (d) => (d.id === 'root' ? 0 : 15))
      .attr('dy', '.35em')
      .attr('text-anchor', (d) => (d.id === 'root' ? 'middle' : 'start'))

    simulation.on('tick', () => {
      linkGroup
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0)
      nodeGroup.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      labelGroup.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    })

    return () => {
      simulation.stop()
    }
  }, [])

  return (
    <div className="flex h-full w-full flex-col bg-[#f1f5f9]">
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)]">
        <div className="text-xl font-bold text-[#0f172a]">
          法律职业能力模型：教育路径探索器
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="relative flex-1">
          <svg ref={svgRef} className="block h-full w-full">
            <g className="lam-nodes" />
            <g className="lam-links" />
            <g className="lam-labels" />
          </svg>
        </div>

        <div
          className={[
            'flex w-80 flex-col overflow-hidden border-l border-black/5 bg-white transition-transform duration-300',
            selected ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
        >
          {selected && (
            <>
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-5">
                <div className="text-base font-semibold text-[#0f172a]">
                  {selected.name}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="cursor-pointer border-none bg-transparent text-2xl text-[#94a3b8] hover:text-[#64748b]"
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-5">
                  <div className="mb-1 text-xs font-semibold uppercase text-[#94a3b8]">
                    维度
                  </div>
                  <div className="text-sm text-[#1e293b]">
                    <span
                      className="inline-block rounded-full bg-[#64748b] px-2 py-1 text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          selected.dimension === 'quality'
                            ? '#10b981'
                            : selected.dimension === 'ability'
                            ? '#3b82f6'
                            : selected.dimension === 'knowledge'
                            ? '#f59e0b'
                            : '#64748b',
                      }}
                    >
                      {DIM_TEXT[selected.dimension] ?? selected.dimension}
                    </span>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="mb-1 text-xs font-semibold uppercase text-[#94a3b8]">
                    层级
                  </div>
                  <div className="text-sm text-[#1e293b]">{selected.level}</div>
                </div>
                <div className="mb-5">
                  <div className="mb-1 text-xs font-semibold uppercase text-[#94a3b8]">
                    定义
                  </div>
                  <div className="text-sm leading-[1.6] text-[#1e293b]">
                    {selected.details?.definition ?? '暂无详细定义。'}
                  </div>
                </div>
                <div className="mb-5">
                  <div className="mb-1 text-xs font-semibold uppercase text-[#94a3b8]">
                    关键技能
                  </div>
                  <div className="text-sm leading-[1.6] text-[#1e293b]">
                    {selected.details?.skills ?? '暂无详细技能说明。'}
                  </div>
                </div>
                <div className="mb-5">
                  <div className="mb-1 text-xs font-semibold uppercase text-[#94a3b8]">
                    培养建议
                  </div>
                  <div className="text-sm leading-[1.6] text-[#1e293b]">
                    {selected.details?.learning_path ?? '暂无详细建议。'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
