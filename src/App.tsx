import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

type GameState = 'start' | 'playing' | 'gameover'

interface Dog {
  x: number
  y: number
  radius: number
  velocity: number
}

interface Obstacle {
  x: number
  topHeight: number
  gap: number
  width: number
  passed: boolean
}

const GRAVITY = 0.5
const JUMP_STRENGTH = -10
const OBSTACLE_SPEED = 3
const OBSTACLE_WIDTH = 60
// Gap size is now dynamic per obstacle
const SPAWN_INTERVAL = 250

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>('start')
  const dogRef = useRef<Dog>({ x: 50, y: 0, radius: 20, velocity: 0 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const scoreRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const lastSpawnRef = useRef(0)
  const dimensionsRef = useRef({ width: 0, height: 0 })
  
  const [gameState, setGameState] = useState<GameState>('start')
  const [score, setScore] = useState(0)

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const centerY = canvas.height / 2
    dogRef.current = {
      x: canvas.width * 0.2,
      y: centerY,
      radius: 20,
      velocity: 0
    }
    obstaclesRef.current = []
    scoreRef.current = 0
    setScore(0)
    lastSpawnRef.current = 0
  }, [])

  const jump = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      dogRef.current.velocity = JUMP_STRENGTH
    }
  }, [])

  const startGame = useCallback(() => {
    gameStateRef.current = 'playing'
    setGameState('playing')
    resetGame()
  }, [resetGame])

  const gameOver = useCallback(() => {
    gameStateRef.current = 'gameover'
    setGameState('gameover')
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const restartGame = useCallback(() => {
    gameStateRef.current = 'playing'
    setGameState('playing')
    resetGame()
  }, [resetGame])

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (gameStateRef.current === 'start') {
      startGame()
    } else if (gameStateRef.current === 'playing') {
      jump()
    } else if (gameStateRef.current === 'gameover') {
      restartGame()
    }
  }, [startGame, jump, restartGame])

  const handleClick = useCallback(() => {
    if (gameStateRef.current === 'start') {
      startGame()
    } else if (gameStateRef.current === 'playing') {
      jump()
    } else if (gameStateRef.current === 'gameover') {
      restartGame()
    }
  }, [startGame, jump, restartGame])

  // Check collision between dog and obstacles
  const checkCollision = useCallback((dog: Dog, obstacle: Obstacle): boolean => {
    const dogLeft = dog.x - dog.radius
    const dogRight = dog.x + dog.radius
    const dogTop = dog.y - dog.radius
    const dogBottom = dog.y + dog.radius

    const obstacleLeft = obstacle.x
    const obstacleRight = obstacle.x + obstacle.width
    const topObstacleBottom = obstacle.topHeight
    const bottomObstacleTop = obstacle.topHeight + obstacle.gap

    // Horizontal collision check
    if (dogRight > obstacleLeft && dogLeft < obstacleRight) {
      // Check top obstacle
      if (dogTop < topObstacleBottom) {
        return true
      }
      // Check bottom obstacle
      if (dogBottom > bottomObstacleTop) {
        return true
      }
    }

    return false
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      dimensionsRef.current = { width: canvas.width, height: canvas.height }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const drawDog = (dog: Dog) => {
      // Draw dog as brown circle
      ctx.beginPath()
      ctx.arc(dog.x, dog.y, dog.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#8B5A2B'
      ctx.fill()
      ctx.strokeStyle = '#654321'
      ctx.lineWidth = 3
      ctx.stroke()
      
      // Draw ears
      ctx.beginPath()
      ctx.ellipse(dog.x - 12, dog.y - 8, 6, 10, -0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#6B4423'
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(dog.x + 12, dog.y - 8, 6, 10, 0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#6B4423'
      ctx.fill()
      
      // Draw nose
      ctx.beginPath()
      ctx.arc(dog.x, dog.y + 5, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#333'
      ctx.fill()
      
      // Draw eyes
      ctx.beginPath()
      ctx.arc(dog.x - 6, dog.y - 3, 3, 0, Math.PI * 2)
      ctx.arc(dog.x + 6, dog.y - 3, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#FFF'
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(dog.x - 6, dog.y - 3, 1.5, 0, Math.PI * 2)
      ctx.arc(dog.x + 6, dog.y - 3, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()
    }

    const drawObstacle = (obstacle: Obstacle, canvasHeight: number) => {
      // Draw bread obstacles (cinnamon color)
      ctx.fillStyle = '#D1A054'
      
      // Top bread
      ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight)
      ctx.strokeStyle = '#8B6914'
      ctx.lineWidth = 3
      ctx.strokeRect(obstacle.x, 0, obstacle.width, obstacle.topHeight)
      
      // Bottom bread
      const bottomY = obstacle.topHeight + obstacle.gap
      const bottomHeight = canvasHeight - bottomY
      ctx.fillRect(obstacle.x, bottomY, obstacle.width, bottomHeight)
      ctx.strokeRect(obstacle.x, bottomY, obstacle.width, bottomHeight)
      
      // Add texture lines (bread details)
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
      
      // Top bread texture
      for (let i = 10; i < obstacle.topHeight - 10; i += 15) {
        ctx.beginPath()
        ctx.moveTo(obstacle.x + 5, i)
        ctx.lineTo(obstacle.x + obstacle.width - 5, i)
        ctx.stroke()
      }
      
      // Bottom bread texture
      for (let i = bottomY + 10; i < canvasHeight - 10; i += 15) {
        ctx.beginPath()
        ctx.moveTo(obstacle.x + 5, i)
        ctx.lineTo(obstacle.x + obstacle.width - 5, i)
        ctx.stroke()
      }
    }

    const drawBackground = () => {
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(1, '#E0F6FF')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw some clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(canvas.width * 0.2, canvas.height * 0.15, 30, 0, Math.PI * 2)
      ctx.arc(canvas.width * 0.25, canvas.height * 0.12, 40, 0, Math.PI * 2)
      ctx.arc(canvas.width * 0.3, canvas.height * 0.15, 30, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(canvas.width * 0.7, canvas.height * 0.2, 25, 0, Math.PI * 2)
      ctx.arc(canvas.width * 0.75, canvas.height * 0.17, 35, 0, Math.PI * 2)
      ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 25, 0, Math.PI * 2)
      ctx.fill()
      
      // Ground
      ctx.fillStyle = '#228B22'
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20)
      ctx.fillStyle = '#006400'
      ctx.fillRect(0, canvas.height - 25, canvas.width, 5)
    }

    const gameLoop = () => {
      if (gameStateRef.current !== 'playing') return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      drawBackground()

      const dog = dogRef.current
      const obstacles = obstaclesRef.current

      // Update dog physics
      dog.velocity += GRAVITY
      dog.y += dog.velocity

      // Check ground collision
      if (dog.y + dog.radius >= canvas.height - 20) {
        gameOver()
        return
      }

      // Check ceiling collision
      if (dog.y - dog.radius <= 0) {
        dog.y = dog.radius
        dog.velocity = 0
      }

      // Spawn obstacles
      const lastObstacle = obstacles[obstacles.length - 1]
      if (!lastObstacle || canvas.width - lastObstacle.x >= SPAWN_INTERVAL) {
        const minGap = 120
        const maxGap = 200
        const gap = Math.random() * (maxGap - minGap) + minGap
        const minHeight = 50
        const maxHeight = canvas.height - gap - minHeight - 40
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight
        
        obstacles.push({
          x: canvas.width,
          topHeight,
          gap,
          width: OBSTACLE_WIDTH,
          passed: false
        })
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i]
        obstacle.x -= OBSTACLE_SPEED

        // Check collision
        if (checkCollision(dog, obstacle)) {
          gameOver()
          return
        }

        // Update score
        if (!obstacle.passed && obstacle.x + obstacle.width < dog.x) {
          obstacle.passed = true
          scoreRef.current += 1
          setScore(scoreRef.current)
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
          obstacles.splice(i, 1)
        }
      }

      // Draw obstacles
      obstacles.forEach(obstacle => {
        drawObstacle(obstacle, canvas.height)
      })

      // Draw dog
      drawDog(dog)

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, checkCollision, gameOver])

  return (
    <div className="game-container" onClick={handleClick} onTouchStart={handleTouch}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
      
      {gameState === 'start' && (
        <div className="overlay">
          <h1 className="game-title">Flappy Dog</h1>
          <p className="instruction">Toca para empezar</p>
          <div className="dog-icon">🐕</div>
        </div>
      )}
      
      {gameState === 'playing' && (
        <div className="score-display">
          <span className="score-number">{score}</span>
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div className="overlay game-over">
          <h2 className="game-over-title">Game Over</h2>
          <p className="final-score">Puntuación: {score}</p>
          <button className="restart-button" onClick={(e) => { e.stopPropagation(); restartGame(); }}>
            Jugar de nuevo
          </button>
        </div>
      )}
    </div>
  )
}

export default App
