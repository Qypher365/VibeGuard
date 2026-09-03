'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Signal Particles — a dark WebGL particle field with soft connecting pulse
 * lines rendered behind the dashboard. Cyan (#06b6d4) and indigo glowing
 * particles drift over a slate/zinc backdrop.
 *
 * Rendered as a fixed, pointer-events-none layer so it never intercepts UI
 * interaction. Auto-resizes to the full viewport on window resize.
 */

const PARTICLE_COUNT = 90
const SPEED = 2.0
const LINK_DISTANCE = 150 // world units for drawing a connecting line
const CYAN = new THREE.Color('#06b6d4')
const INDIGO = new THREE.Color('#6366f1')

export function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let width = mount.clientWidth
    let height = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Orthographic camera keeps particle sizes stable in screen space.
    const camera = new THREE.OrthographicCamera(
      0,
      width,
      0,
      height,
      -1000,
      1000,
    )
    camera.position.z = 10

    const scene = new THREE.Scene()

    // --- Particle state ---------------------------------------------------
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 2)
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = Math.random() * width
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = 0

      const angle = Math.random() * Math.PI * 2
      const mag = (0.15 + Math.random() * 0.35) * SPEED
      velocities[i * 2] = Math.cos(angle) * mag
      velocities[i * 2 + 1] = Math.sin(angle) * mag

      const c = Math.random() > 0.5 ? CYAN : INDIGO
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    // --- Points (glowing particles) --------------------------------------
    const pointsGeometry = new THREE.BufferGeometry()
    pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    )
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Soft radial sprite so particles read as glowing dots rather than squares.
    const sprite = makeGlowTexture()
    const pointsMaterial = new THREE.PointsMaterial({
      size: 14,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    })
    const points = new THREE.Points(pointsGeometry, pointsMaterial)
    scene.add(points)

    // --- Connecting pulse lines ------------------------------------------
    const maxLineVerts = PARTICLE_COUNT * PARTICLE_COUNT
    const linePositions = new Float32Array(maxLineVerts * 3)
    const lineColors = new Float32Array(maxLineVerts * 3)
    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    )
    lineGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(lineColors, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    )
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    let raf = 0
    const posAttr = pointsGeometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute

    const animate = () => {
      // Move particles and bounce off edges.
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let x = positions[i * 3] + velocities[i * 2]
        let y = positions[i * 3 + 1] + velocities[i * 2 + 1]

        if (x <= 0 || x >= width) {
          velocities[i * 2] *= -1
          x = Math.max(0, Math.min(width, x))
        }
        if (y <= 0 || y >= height) {
          velocities[i * 2 + 1] *= -1
          y = Math.max(0, Math.min(height, y))
        }
        positions[i * 3] = x
        positions[i * 3 + 1] = y
      }
      posAttr.needsUpdate = true

      // Rebuild connecting lines between nearby particles.
      let v = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const xi = positions[i * 3]
        const yi = positions[i * 3 + 1]
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = xi - positions[j * 3]
          const dy = yi - positions[j * 3 + 1]
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DISTANCE) {
            const alpha = 1 - dist / LINK_DISTANCE
            linePositions[v * 3] = xi
            linePositions[v * 3 + 1] = yi
            linePositions[v * 3 + 2] = 0
            lineColors[v * 3] = colors[i * 3] * alpha
            lineColors[v * 3 + 1] = colors[i * 3 + 1] * alpha
            lineColors[v * 3 + 2] = colors[i * 3 + 2] * alpha
            v++
            linePositions[v * 3] = positions[j * 3]
            linePositions[v * 3 + 1] = positions[j * 3 + 1]
            linePositions[v * 3 + 2] = 0
            lineColors[v * 3] = colors[j * 3] * alpha
            lineColors[v * 3 + 1] = colors[j * 3 + 1] * alpha
            lineColors[v * 3 + 2] = colors[j * 3 + 2] * alpha
            v++
          }
        }
      }
      lineGeometry.setDrawRange(0, v)
      ;(lineGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate =
        true
      ;(lineGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate =
        true

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      width = mount.clientWidth
      height = mount.clientHeight
      renderer.setSize(width, height)
      camera.right = width
      camera.bottom = height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      pointsGeometry.dispose()
      pointsMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      sprite.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}

/** Build a soft radial-gradient sprite used to make particles glow. */
function makeGlowTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.25)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
