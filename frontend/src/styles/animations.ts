/**
 * Animation Utilities
 * 微交互动效样式 - 纯 CSS 实现
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
  hoverLift: {
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  cardHover: {
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  smoothTransition: {
    transition: 'all 0.2s ease',
  },
}

// 悬停效果的 CSS 类
export const hoverClasses = `
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-glow:hover {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.active-press:active {
  transform: scale(0.98);
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