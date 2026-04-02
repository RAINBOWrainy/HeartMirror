/**
 * MoodIcon Components
 * SVG mood icons to replace emojis for consistency and accessibility
 * These icons can be styled, themed, and work across all platforms
 */

import React from 'react'
import { brandColors } from '../../theme'

interface MoodIconProps {
  size?: number
  color?: string
  className?: string
  'aria-label'?: string
}

// Joy/Happy Icon - Smiling face with gradient
export const JoyIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionJoy,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="开心"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="10" r="1.5" fill={color} />
    <circle cx="16" cy="10" r="1.5" fill={color} />
    <path
      d="M8 14c0.5 1.5 2 2.5 4 2.5s3.5-1 4-2.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Calm/Peaceful Icon - Serene face
export const CalmIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionCalm,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="平静"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <path d="M7 10h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 10h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M9 15c0.5 0.5 1.5 1 3 1s2.5-0.5 3-1"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Sadness Icon - Sad face
export const SadnessIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionSadness,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="悲伤"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="10" r="1.5" fill={color} />
    <circle cx="16" cy="10" r="1.5" fill={color} />
    <path
      d="M8 16c0.5-1.5 2-2.5 4-2.5s3.5 1 4 2.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Anxiety Icon - Worried face
export const AnxietyIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionAnxiety,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="焦虑"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="10" r="1.5" fill={color} />
    <circle cx="16" cy="10" r="1.5" fill={color} />
    <path
      d="M9 16c0.5-1 1.5-1.5 3-1.5s2.5 0.5 3 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M14.5 7c0.5-0.5 1.5-0.5 2 0"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
)

// Anger Icon - Angry face
export const AngerIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionAnger,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="愤怒"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <path
      d="M7 8l2 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17 8l-2 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="8" cy="11" r="1.5" fill={color} />
    <circle cx="16" cy="11" r="1.5" fill={color} />
    <path
      d="M8 16c0.5-1 2-1.5 4-1.5s3.5 0.5 4 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Fear Icon - Scared face
export const FearIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = brandColors.emotionFear,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="恐惧"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <ellipse cx="8" cy="10" rx="1.5" ry="2" fill={color} />
    <ellipse cx="16" cy="10" rx="1.5" ry="2" fill={color} />
    <ellipse cx="12" cy="16" rx="2" ry="1.5" fill={color} />
  </svg>
)

// Frustration/Tired Icon - Tired face
export const FrustrationIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = '#95DE64',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="疲惫"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <path d="M7 10h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 10h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M9 15c0.5 0.5 1.5 1 3 1s2.5-0.5 3-1"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// Neutral Icon - Neutral face
export const NeutralIcon: React.FC<MoodIconProps> = ({
  size = 24,
  color = '#8C8C8C',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="中性"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <circle cx="8" cy="10" r="1.5" fill={color} />
    <circle cx="16" cy="10" r="1.5" fill={color} />
    <path d="M8 15h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Mood icon map for easy lookup
export const moodIcons = {
  joy: JoyIcon,
  calm: CalmIcon,
  sadness: SadnessIcon,
  anxiety: AnxietyIcon,
  anger: AngerIcon,
  fear: FearIcon,
  frustration: FrustrationIcon,
  neutral: NeutralIcon,
}

// Mood option configuration with icons
export const MOOD_CONFIG = [
  {
    value: 'joy',
    label: '开心',
    color: brandColors.emotionJoy,
    softColor: brandColors.emotionJoySoft,
    Icon: JoyIcon,
  },
  {
    value: 'calm',
    label: '平静',
    color: brandColors.emotionCalm,
    softColor: brandColors.emotionCalmSoft,
    Icon: CalmIcon,
  },
  {
    value: 'sadness',
    label: '低落',
    color: brandColors.emotionSadness,
    softColor: brandColors.emotionSadnessSoft,
    Icon: SadnessIcon,
  },
  {
    value: 'anxiety',
    label: '焦虑',
    color: brandColors.emotionAnxiety,
    softColor: brandColors.emotionAnxietySoft,
    Icon: AnxietyIcon,
  },
  {
    value: 'anger',
    label: '愤怒',
    color: brandColors.emotionAnger,
    softColor: brandColors.emotionAngerSoft,
    Icon: AngerIcon,
  },
  {
    value: 'fear',
    label: '恐惧',
    color: brandColors.emotionFear,
    softColor: brandColors.emotionFearSoft,
    Icon: FearIcon,
  },
  {
    value: 'frustration',
    label: '疲惫',
    color: '#95DE64',
    softColor: 'rgba(149, 222, 100, 0.2)',
    Icon: FrustrationIcon,
  },
  {
    value: 'neutral',
    label: '中性',
    color: '#8C8C8C',
    softColor: 'rgba(140, 140, 140, 0.2)',
    Icon: NeutralIcon,
  },
]

export default moodIcons