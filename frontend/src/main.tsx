import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { injectAnimations } from './styles/animations'

// 注入动画样式
injectAnimations()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)