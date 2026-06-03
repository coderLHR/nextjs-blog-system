'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface NodeDatum {
  id: number
  pos: [number, number, number]
  color: number
  name: string
  desc: string
  links: number[]
}

const NODES_DATA: NodeDatum[] = [
  { id: 1, pos: [15, 0, 8], color: 0x10b981, name: '专业理论', desc: '扎根于知识体系底层', links: [4, 5] },
  { id: 2, pos: [4, 16, 0], color: 0x3b82f6, name: '领导与沟通', desc: '高素质与基础知识的结合', links: [4, 6] },
  { id: 3, pos: [0, 12, 16], color: 0xec4899, name: '实战解决力', desc: '素质转化为实际动手能力', links: [5, 6] },
  { id: 4, pos: [10, 10, 10], color: 0x8b5cf6, name: '核心竞争力', desc: '三维度均衡发展的综合体', links: [1, 2, 3] },
  { id: 5, pos: [18, 0, 18], color: 0xf59e0b, name: '跨界融合', desc: '能力与知识的极致碰撞', links: [1, 3] },
  { id: 6, pos: [0, 18, 8], color: 0x06b6d4, name: '抗压韧性', desc: '隐性的高层次素质', links: [2, 3] },
]

/**
 * 3D 能力模型坐标系 (源自 gemini-code-1778835705519)
 * Three.js 球体、坐标平面、OrbitControls 与悬浮连线
 */
export default function AbilityModel3DDemo() {
  const mountRef = useRef<HTMLDivElement>(null)
  const labelXRef = useRef<HTMLDivElement>(null)
  const labelYRef = useRef<HTMLDivElement>(null)
  const labelZRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const ttTitleRef = useRef<HTMLDivElement>(null)
  const ttDescRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.015)

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    )
    camera.position.set(35, 30, 45)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(10, 10, 10)
    controls.maxDistance = 80
    controls.minDistance = 10

    // 灯光
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(20, 40, 30)
    scene.add(dirLight)

    // 渐变平面
    const planes: THREE.Mesh[] = []
    const PLANE_SIZE = 20

    const createGradientPlane = (
      colorTop: number,
      colorBottom: number,
      pos: [number, number, number],
      rot: [number, number, number]
    ) => {
      const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1)
      const colors: number[] = []
      const cT = new THREE.Color(colorTop)
      const cB = new THREE.Color(colorBottom)
      colors.push(cT.r, cT.g, cT.b, cT.r, cT.g, cT.b, cB.r, cB.g, cB.b, cB.r, cB.g, cB.b)
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      mesh.userData = { targetColor: new THREE.Color(0xffffff) }
      scene.add(mesh)
      planes.push(mesh)

      const grid = new THREE.GridHelper(PLANE_SIZE, 10, 0xffffff, 0xffffff)
      ;(grid.material as THREE.Material).transparent = true
      ;(grid.material as THREE.Material).opacity = 0.25
      grid.position.set(...pos)
      grid.rotation.set(...rot)
      scene.add(grid)
    }

    createGradientPlane(0xe0f2fe, 0x38bdf8, [10, 10, 0], [0, 0, 0])
    createGradientPlane(0xfce7f3, 0xf472b6, [0, 10, 10], [0, Math.PI / 2, 0])
    createGradientPlane(0xdcfce7, 0x4ade80, [10, 0, 10], [-Math.PI / 2, 0, 0])

    // 球体
    const spheres: THREE.Mesh[] = []
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32)
    NODES_DATA.forEach((data) => {
      const material = new THREE.MeshPhysicalMaterial({
        color: data.color,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.5,
        thickness: 1.5,
      })
      const mesh = new THREE.Mesh(sphereGeometry, material)
      mesh.position.set(...data.pos)
      mesh.userData = { ...data, targetScale: 1, originalColor: data.color }
      scene.add(mesh)
      spheres.push(mesh)
    })

    // 连线
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.6,
    })
    const lineGeometry = new THREE.BufferGeometry()
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineMesh)

    // Raycaster
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredSphere: THREE.Mesh | null = null

    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      const sphereIntersects = raycaster.intersectObjects(spheres)
      if (sphereIntersects.length > 0) {
        const object = sphereIntersects[0].object as THREE.Mesh
        if (hoveredSphere !== object) {
          if (hoveredSphere) hoveredSphere.userData.targetScale = 1
          hoveredSphere = object
          hoveredSphere.userData.targetScale = 1.5
          if (ttTitleRef.current && ttDescRef.current && tooltipRef.current) {
            ttTitleRef.current.innerText = hoveredSphere.userData.name
            ttTitleRef.current.style.color =
              '#' + hoveredSphere.userData.color.toString(16).padStart(6, '0')
            ttDescRef.current.innerText = hoveredSphere.userData.desc
            tooltipRef.current.style.opacity = '1'
            tooltipRef.current.style.transform = 'translate(-50%, -120%) scale(1)'
          }
          const points: THREE.Vector3[] = []
          const links = hoveredSphere.userData.links as number[]
          links.forEach((targetId: number) => {
            const target = spheres.find((s) => s.userData.id === targetId)
            if (target) {
              points.push(hoveredSphere!.position.clone())
              points.push(target.position.clone())
            }
          })
          lineGeometry.setFromPoints(points)
          lineMesh.visible = true
        }
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.clientX + 'px'
          tooltipRef.current.style.top = event.clientY + 'px'
        }
        planes.forEach((p) => p.userData.targetColor.setHex(0xffffff))
        return
      }

      if (hoveredSphere) {
        hoveredSphere.userData.targetScale = 1
        hoveredSphere = null
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0'
          tooltipRef.current.style.transform = 'translate(-50%, -100%) scale(0.95)'
        }
        lineMesh.visible = false
      }

      const planeIntersects = raycaster.intersectObjects(planes)
      planes.forEach((p) => p.userData.targetColor.setHex(0xffffff))
      if (planeIntersects.length > 0) {
        planeIntersects[0].object.userData.targetColor.setHex(0xbbbbbb)
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    // 标签
    const labels = {
      x: { el: labelXRef.current, pos: new THREE.Vector3(22, 0, 0) },
      y: { el: labelYRef.current, pos: new THREE.Vector3(0, 22, 0) },
      z: { el: labelZRef.current, pos: new THREE.Vector3(0, 0, 22) },
    }

    const updateLabels = () => {
      for (const key in labels) {
        const item = labels[key as keyof typeof labels]
        if (!item.el) continue
        const vector = item.pos.clone().project(camera)
        const x = (vector.x * 0.5 + 0.5) * mount.clientWidth
        const y = (-vector.y * 0.5 + 0.5) * mount.clientHeight
        if (vector.z > 1) {
          item.el.style.opacity = '0'
        } else {
          item.el.style.opacity = '1'
          item.el.style.left = `${x}px`
          item.el.style.top = `${y}px`
        }
      }
    }

    let raf = 0
    const animate = () => {
      controls.update()
      planes.forEach((plane) => {
        ;(plane.material as THREE.MeshBasicMaterial).color.lerp(
          plane.userData.targetColor,
          0.1
        )
      })
      spheres.forEach((sphere) => {
        const ts = sphere.userData.targetScale
        sphere.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.15)
        sphere.rotation.y += 0.01
      })
      updateLabels()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    setReady(true)
    animate()

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8fafc]">
      <div
        ref={labelXRef}
        className="am3d-label"
        style={{
          position: 'absolute',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          transition: 'opacity 0.3s',
          zIndex: 5,
        }}
      >
        知识 (Knowledge)
      </div>
      <div
        ref={labelYRef}
        className="am3d-label"
        style={{
          position: 'absolute',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          transition: 'opacity 0.3s',
          zIndex: 5,
        }}
      >
        素质 (Quality)
      </div>
      <div
        ref={labelZRef}
        className="am3d-label"
        style={{
          position: 'absolute',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          transition: 'opacity 0.3s',
          zIndex: 5,
        }}
      >
        能力 (Ability)
      </div>

      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '14px',
          pointerEvents: 'none',
          opacity: 0,
          transform: 'translate(-50%, -120%)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div ref={ttTitleRef} style={{ fontWeight: 'bold', fontSize: '16px', color: '#38bdf8' }} />
        <div ref={ttDescRef} style={{ color: '#cbd5e1', fontSize: '12px' }} />
      </div>

      <div ref={mountRef} className="block h-full w-full" />
    </div>
  )
}
