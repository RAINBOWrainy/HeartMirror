/**
 * Animation Utilities
 * 微交互动效样式 - 纯 CSS 实现 - 温暖友好风格
 */

// CSS keyframes 字符串
export const animationKeyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

@keyframes messageBubbleIn {
  from { opacity: 0; transform: scale(0.8) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 温暖微交互动画 */
@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes softPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.02); }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.15); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.03); opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
`

// 动画样式对象（用于 inline style）
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
  },
  slideInRight: {
    animation: 'slideInRight 0.3s ease-out',
  },
  slideInLeft: {
    animation: 'slideInLeft 0.3s ease-out',
  },
  scaleIn: {
    animation: 'scaleIn 0.2s ease-out',
  },
  bounce: {
    animation: 'bounce 0.5s ease',
  },
  pulse: {
    animation: 'pulse 2s ease-in-out infinite',
  },
  messageBubbleIn: {
    animation: 'messageBubbleIn 0.3s ease-out',
  },
  spin: {
    animation: 'spin 1s linear infinite',
  },
  // 温暖微交互动画
  gentleBounce: {
    animation: 'gentleBounce 2s ease-in-out infinite',
  },
  softPulse: {
    animation: 'softPulse 3s ease-in-out infinite',
  },
  heartBeat: {
    animation: 'heartBeat 1.3s ease-in-out',
  },
  slideUpFade: {
    animation: 'slideUpFade 0.4s ease-out',
  },
  breathe: {
    animation: 'breathe 4s ease-in-out infinite',
  },
  float: {
    animation: 'float 3s ease-in-out infinite',
  },
  // 悬停效果
  hoverLift: {
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    cursor: 'pointer',
  },
  cardHover: {
    transition: 'all 0.25s ease',
    cursor: 'pointer',
  },
  smoothTransition: {
    transition: 'all 0.25s ease',
  },
}

// 悬停效果的 CSS 类
export const hoverClasses = `
.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.15);
}

.hover-glow:hover {
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.card-hover:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(124, 58, 237, 0.12);
}

.active-press:active {
  transform: scale(0.97);
}

/* 温暖按钮效果 */
.btn-warm {
  transition: all 0.25s ease;
}

.btn-warm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.2);
}

.btn-warm:active {
  transform: scale(0.97);
}

/* 温暖卡片效果 */
.card-warm {
  transition: all 0.3s ease;
  border: 1px solid rgba(124, 58, 237, 0.08);
}

.card-warm:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.15);
}

/* 聊天气泡动画 */
.chat-bubble-enter {
  animation: slideUpFade 0.35s ease-out forwards;
}

/* 情绪徽章脉冲 */
.emotion-badge-pulse {
  animation: softPulse 2.5s ease-in-out infinite;
}

/* 加载状态 */
.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
`

// 注入动画样式到页面
export const injectAnimations = () => {
  if (typeof document === 'undefined') return

  const existingStyle = document.getElementById('heartmirror-animations')
  if (existingStyle) return

  const style = document.createElement('style')
  style.id = 'heartmirror-animations'
  style.textContent = animationKeyframes + hoverClasses
  document.head.appendChild(style)
}

export default animations