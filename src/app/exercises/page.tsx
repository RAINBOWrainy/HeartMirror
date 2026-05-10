'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';

const JOURNAL_KEY = 'heartmirror-journal-entries';
const EXERCISES_KEY = 'heartmirror-exercise-completions';

const MINDFULNESS_EXERCISES = [
  {
    id: 'breathing',
    icon: '🌬️',
    nameZh: '深呼吸练习',
    nameEn: 'Breathing Exercise',
    descriptionZh: '4-7-8 呼吸法：吸气4秒，屏息7秒，呼气8秒，重复3次。这是最快速的放松技巧。',
    descriptionEn: '4-7-8 Breathing: Inhale 4s, hold 7s, exhale 8s. Repeat 3 times. Quickest relaxation technique.',
    duration: '3 min',
    durationMin: 3,
    category: 'breathing',
    categoryZh: '呼吸',
    categoryEn: 'Breathing',
    instructions: {
      step1: { zh: '坐直或躺下，放松身体', en: 'Sit or lie down, relax your body' },
      step2: { zh: '通过鼻子吸气4秒', en: 'Inhale through your nose for 4 seconds' },
      step3: { zh: '屏住呼吸7秒', en: 'Hold your breath for 7 seconds' },
      step4: { zh: '通过嘴巴呼气8秒', en: 'Exhale through your mouth for 8 seconds' },
      step5: { zh: '重复3次', en: 'Repeat 3 times' },
    },
  },
  {
    id: 'body-scan',
    icon: '🧘',
    nameZh: '身体扫描',
    nameEn: 'Body Scan',
    descriptionZh: '从脚趾到头顶，依次感受身体每个部位的放松。帮助察觉身体紧张的地方。',
    descriptionEn: 'Scan from toes to head, notice sensations in each body part. Helps identify areas of tension.',
    duration: '5 min',
    durationMin: 5,
    category: 'relaxation',
    categoryZh: '放松',
    categoryEn: 'Relaxation',
    instructions: {
      step1: { zh: '躺下，闭眼', en: 'Lie down and close your eyes' },
      step2: { zh: '注意脚趾的感觉', en: 'Notice sensations in your toes' },
      step3: { zh: '慢慢向上移动注意力到小腿', en: 'Slowly move attention up to your calves' },
      step4: { zh: '继续向上到大腿、臀部', en: 'Continue up to thighs, hips' },
      step5: { zh: '感受腹部、胸部', en: 'Feel your abdomen, chest' },
      step6: { zh: '放松肩膀、手臂', en: 'Relax shoulders, arms' },
      step7: { zh: '最后是脸部和头部', en: 'Finally face and head' },
    },
  },
  {
    id: 'gratitude',
    icon: '🙏',
    nameZh: '感恩冥想',
    nameEn: 'Gratitude Meditation',
    descriptionZh: '想想3件让你感激的事，感受温暖的情绪。感恩可以提升心情和幸福感。',
    descriptionEn: 'Think of 3 things you are grateful for. Gratitude boosts mood and well-being.',
    duration: '3 min',
    durationMin: 3,
    category: 'mindfulness',
    categoryZh: '正念',
    categoryEn: 'Mindfulness',
    instructions: {
      step1: { zh: '闭眼，深呼吸3次', en: 'Close eyes, take 3 deep breaths' },
      step2: { zh: '想一件让你感激的事（人、事物、经历）', en: 'Think of one thing you are grateful for' },
      step3: { zh: '感受感激之情在身体中的温暖', en: 'Feel the warmth of gratitude in your body' },
      step4: { zh: '再想一件，继续感受', en: 'Think of another, continue feeling' },
      step5: { zh: '第三件，感受完整的温暖', en: 'Third one, feel complete warmth' },
    },
  },
  {
    id: 'grounding',
    icon: '🌍',
    nameZh: '5-4-3-2-1 接地练习',
    nameEn: '5-4-3-2-1 Grounding',
    descriptionZh: '用5种感官帮助自己回到当下。当感到焦虑或恐慌时特别有效。',
    descriptionEn: 'Use 5 senses to return to the present moment. Especially effective for anxiety or panic.',
    duration: '5 min',
    durationMin: 5,
    category: 'grounding',
    categoryZh: '接地',
    categoryEn: 'Grounding',
    instructions: {
      step1: { zh: '说出5样你能看到的东西', en: 'Name 5 things you can see' },
      step2: { zh: '说出4样你能触摸的东西', en: 'Name 4 things you can touch' },
      step3: { zh: '说出3样你能听到的声音', en: 'Name 3 things you can hear' },
      step4: { zh: '说出2样你能闻到的气味', en: 'Name 2 things you can smell' },
      step5: { zh: '说出1样你能尝到的味道', en: 'Name 1 thing you can taste' },
    },
  },
  {
    id: 'self-compassion',
    icon: '💚',
    nameZh: '自我慈悲',
    nameEn: 'Self-Compassion Break',
    descriptionZh: '觉察痛苦情绪，用温柔的话语安慰自己。这帮助你停止自我批评。',
    descriptionEn: 'Notice painful emotions, comfort yourself with kind words. Helps stop self-criticism.',
    duration: '4 min',
    durationMin: 4,
    category: 'compassion',
    categoryZh: '慈悲',
    categoryEn: 'Compassion',
    instructions: {
      step1: { zh: '觉察此刻的痛苦感受', en: 'Notice the painful feeling right now' },
      step2: { zh: '对自己说："这是苦难的一部分"', en: 'Say to yourself: "This is a moment of suffering"' },
      step3: { zh: '对自己说："苦难是生活的一部分"', en: 'Say: "Suffering is part of life"' },
      step4: { zh: '用手放在心口，对自己说温暖的话', en: 'Put hand on heart, say kind words to yourself' },
    },
  },
  {
    id: 'progressive-relaxation',
    icon: '😌',
    nameZh: '渐进式肌肉放松',
    nameEn: 'Progressive Relaxation',
    descriptionZh: '依次紧张和放松全身肌肉群，从脚到头。释放身体紧张和压力。',
    descriptionEn: 'Tense and release each muscle group from feet to head. Releases physical tension and stress.',
    duration: '10 min',
    durationMin: 10,
    category: 'relaxation',
    categoryZh: '放松',
    categoryEn: 'Relaxation',
    instructions: {
      step1: { zh: '先紧张脚部肌肉5秒，然后放松', en: 'Tense foot muscles for 5 seconds, then relax' },
      step2: { zh: '紧张小腿，然后放松', en: 'Tense calves, then relax' },
      step3: { zh: '紧张大腿，然后放松', en: 'Tense thighs, then relax' },
      step4: { zh: '紧张臀部，然后放松', en: 'Tense hips, then relax' },
      step5: { zh: '紧张腹部，然后放松', en: 'Tense abdomen, then relax' },
      step6: { zh: '紧张胸部，然后放松', en: 'Tense chest, then relax' },
      step7: { zh: '紧张手、手臂，然后放松', en: 'Tense hands, arms, then relax' },
      step8: { zh: '紧张肩膀、脸，然后放松', en: 'Tense shoulders, face, then relax' },
    },
  },
  {
    id: 'loving-kindness',
    icon: '💕',
    nameZh: '慈心禅修',
    nameEn: 'Loving-Kindness',
    descriptionZh: '向自己、亲人、陌生人传递善意和祝福。培养爱与善意的心量。',
    descriptionEn: 'Send goodwill to yourself, loved ones, and strangers. Cultivates love and kindness.',
    duration: '6 min',
    durationMin: 6,
    category: 'mindfulness',
    categoryZh: '正念',
    categoryEn: 'Mindfulness',
    instructions: {
      step1: { zh: '闭眼，想着"愿我平安"', en: 'Close eyes, think "May I be at peace"' },
      step2: { zh: '加上"愿我健康" "愿我被善待"', en: 'Add "May I be healthy" "May I be treated well"' },
      step3: { zh: '想着一个你爱的人，说"愿你平安"', en: 'Think of someone you love, say "May you be at peace"' },
      step4: { zh: '扩展到朋友、同事', en: 'Expand to friends, colleagues' },
      step5: { zh: '最后是所有人："愿所有人平安"', en: 'Finally all people: "May all beings be at peace"' },
    },
  },
  {
    id: 'thought-observation',
    icon: '💭',
    nameZh: '观察想法',
    nameEn: 'Thought Observation',
    descriptionZh: '像天空观察云朵一样，观察流过的想法，不评判。帮助你与想法分离。',
    descriptionEn: 'Watch thoughts pass like clouds in the sky, without judgment. Helps detach from thoughts.',
    duration: '5 min',
    durationMin: 5,
    category: 'mindfulness',
    categoryZh: '正念',
    categoryEn: 'Mindfulness',
    instructions: {
      step1: { zh: '舒适坐好，闭眼', en: 'Sit comfortably, close eyes' },
      step2: { zh: '注意呼吸节奏', en: 'Notice your breathing rhythm' },
      step3: { zh: '当想法出现时，像观察云一样看着它', en: 'When a thought arises, watch it like a cloud' },
      step4: { zh: '不要跟随想法，只是观察', en: 'Do not follow the thought, just observe' },
      step5: { zh: '让想法像云一样飘过', en: 'Let thoughts pass like clouds' },
    },
  },
  {
    id: 'visualization',
    icon: '🏖️',
    nameZh: '可视化放松',
    nameEn: 'Visualization Relaxation',
    descriptionZh: '想象一个让你感到平静和安全的地方，如海边、森林或任何你喜欢的场景。',
    descriptionEn: 'Imagine a place where you feel calm and safe, like a beach, forest, or any favorite place.',
    duration: '5 min',
    durationMin: 5,
    category: 'relaxation',
    categoryZh: '放松',
    categoryEn: 'Relaxation',
    instructions: {
      step1: { zh: '闭眼，深呼吸', en: 'Close eyes, breathe deeply' },
      step2: { zh: '想象一个让你平静的地方', en: 'Imagine a place where you feel calm' },
      step3: { zh: '用所有感官感受那个地方', en: 'Use all senses to experience that place' },
      step4: { zh: '注意看到的颜色、听到的声音', en: 'Notice colors you see, sounds you hear' },
      step5: { zh: '感受那个地方的温度、气味', en: 'Feel the temperature, smells of that place' },
    },
  },
  {
    id: 'mindful-eating',
    icon: '🍽️',
    nameZh: '正念饮食',
    nameEn: 'Mindful Eating',
    descriptionZh: '用感官充分体验一口食物。帮助改善饮食关系，培养专注力。',
    descriptionEn: 'Fully experience one bite of food with your senses. Helps improve eating relationship.',
    duration: '5 min',
    durationMin: 5,
    category: 'mindfulness',
    categoryZh: '正念',
    categoryEn: 'Mindfulness',
    instructions: {
      step1: { zh: '选择一小口食物（葡萄干、巧克力等）', en: 'Choose a small bite of food (raisin, chocolate, etc.)' },
      step2: { zh: '用眼睛观察它的颜色、形状', en: 'Observe its color, shape with your eyes' },
      step3: { zh: '用手触摸它的质感', en: 'Touch its texture with your hands' },
      step4: { zh: '放在嘴里，但不要嚼', en: 'Put it in your mouth, but do not chew' },
      step5: { zh: '慢慢咀嚼，品尝味道', en: 'Chew slowly, taste the flavor' },
    },
  },
  {
    id: 'walking-meditation',
    icon: '🚶',
    nameZh: '行走冥想',
    nameEn: 'Walking Meditation',
    descriptionZh: '缓慢行走时专注每一步的感觉。连接身体与心灵，适合户外练习。',
    descriptionEn: 'Focus on each step while walking slowly. Connects body and mind, great outdoors.',
    duration: '10 min',
    durationMin: 10,
    category: 'movement',
    categoryZh: '运动',
    categoryEn: 'Movement',
    instructions: {
      step1: { zh: '站立片刻，感受双脚', en: 'Stand for a moment, feel your feet' },
      step2: { zh: '开始缓慢行走', en: 'Start walking slowly' },
      step3: { zh: '专注脚抬起、移动、落下的感觉', en: 'Focus on feeling of foot lifting, moving, landing' },
      step4: { zh: '注意手臂摆动、身体平衡', en: 'Notice arm swing, body balance' },
      step5: { zh: '走10分钟后正常活动', en: 'After 10 min, return to normal activity' },
    },
  },
  {
    id: 'music-meditation',
    icon: '🎵',
    nameZh: '音乐冥想',
    nameEn: 'Music Meditation',
    descriptionZh: '选择柔和的音乐，闭眼专注旋律和节奏。让音乐带你进入放松状态。',
    descriptionEn: 'Choose gentle music, close eyes and focus on melody and rhythm. Let music guide relaxation.',
    duration: '10 min',
    durationMin: 10,
    category: 'mindfulness',
    categoryZh: '正念',
    categoryEn: 'Mindfulness',
    instructions: {
      step1: { zh: '选择柔和、舒缓的音乐', en: 'Choose gentle, soothing music' },
      step2: { zh: '躺下或舒适坐着', en: 'Lie down or sit comfortably' },
      step3: { zh: '闭眼，专注音乐', en: 'Close eyes, focus on the music' },
      step4: { zh: '让旋律带你进入放松状态', en: 'Let the melody guide you into relaxation' },
      step5: { zh: '音乐结束后，慢慢睁开眼', en: 'When music ends, slowly open eyes' },
    },
  },
];

// Get unique categories
const getCategories = () => {
  const cats = new Set(MINDFULNESS_EXERCISES.map(e => e.category));
  return Array.from(cats).map(c => ({
    id: c,
    nameZh: MINDFULNESS_EXERCISES.find(e => e.category === c)?.categoryZh || c,
    nameEn: MINDFULNESS_EXERCISES.find(e => e.category === c)?.categoryEn || c,
  }));
};

export default function ExercisesPage() {
  const { locale } = useLocale();
  const [selectedExercise, setSelectedExercise] = useState<typeof MINDFULNESS_EXERCISES[0] | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentMoodAvg, setRecentMoodAvg] = useState<number | null>(null);

  // Load recent mood average for recommendations
  useEffect(() => {
    const stored = localStorage.getItem(JOURNAL_KEY);
    if (!stored) return;
    try {
      const entries = JSON.parse(stored) as Array<{ createdAt: number; moodScore: number }>;
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const last7d = entries.filter(e => now - e.createdAt < 7 * dayMs);
      if (last7d.length > 0) {
        const avg = last7d.reduce((sum, e) => sum + e.moodScore, 0) / last7d.length;
        setRecentMoodAvg(avg);
      }
    } catch { /* ignore */ }
  }, []);

  // Rules-based recommendations
  const getRecommendations = () => {
    if (recentMoodAvg === null) return []; // No filter if no data

    const recommendations: Array<{ id: string; reason: string }> = [];

    if (recentMoodAvg <= 4) {
      // Low mood: prioritize grounding and breathing (quick anxiety relief)
      recommendations.push({ id: 'grounding', reason: 'Anxiety relief' });
      recommendations.push({ id: 'breathing', reason: 'Quick calm' });
      recommendations.push({ id: 'self-compassion', reason: 'Self-kindness' });
    } else if (recentMoodAvg <= 6) {
      // Moderate mood: balance of relaxation and mindfulness
      recommendations.push({ id: 'body-scan', reason: 'Tension release' });
      recommendations.push({ id: 'gratitude', reason: 'Mood boost' });
    } else {
      // Good mood: maintain with mindfulness
      recommendations.push({ id: 'gratitude', reason: 'Maintain well-being' });
      recommendations.push({ id: 'mindfulness', reason: 'Strengthen awareness' });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();
  const categories = getCategories();
  const filteredExercises = selectedCategory
    ? MINDFULNESS_EXERCISES.filter(e => e.category === selectedCategory)
    : MINDFULNESS_EXERCISES;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && selectedExercise) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev >= selectedExercise.durationMin * 60) {
            setIsTimerRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, selectedExercise]);

  // Phase 4: Save exercise completion to localStorage when timer finishes
  useEffect(() => {
    if (!isTimerRunning && selectedExercise && timerSeconds >= selectedExercise.durationMin * 60) {
      const completion = {
        id: `exercise-${Date.now()}`,
        createdAt: Date.now(),
        exerciseId: selectedExercise.id,
        durationMin: selectedExercise.durationMin,
      };
      try {
        const key = EXERCISES_KEY;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(completion);
        localStorage.setItem(key, JSON.stringify(existing));
        // Show completion toast
        const label = locale === 'zh' ? selectedExercise.nameZh : selectedExercise.nameEn;
        // We don't have setToast here, but the timer stopping is feedback enough
      } catch { /* storage full */ }
    }
  }, [isTimerRunning, selectedExercise, timerSeconds]);

  const startExercise = () => {
    setActiveStep(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const stopExercise = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setActiveStep(0);
  };

  const nextStep = () => {
    if (!selectedExercise) return;
    const instructions = Object.keys(selectedExercise.instructions);
    if (activeStep < instructions.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {locale === 'zh' ? '正念训练' : 'Mindfulness Exercises'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '通过练习培养内心平静' : 'Cultivate inner peace through practice'}
              </p>
            </div>
            <Link href="/tracker" className="text-sm px-3 py-1.5 rounded"
              style={{ color: 'var(--muted)' }}>
              ← {locale === 'zh' ? '返回看板' : 'Back to Dashboard'}
            </Link>
          </div>
        </div>

        {/* Phase 5: Exercise Recommendations Banner */}
        {recommendations.length > 0 && (
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--accent)' }}>
              {locale === 'zh' ? '推荐练习（基于最近心情）' : 'Recommended for you'}
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendations.map(rec => {
                const ex = MINDFULNESS_EXERCISES.find(e => e.id === rec.id);
                if (!ex) return null;
                return (
                  <button key={rec.id} onClick={() => { setSelectedExercise(ex); setIsTimerRunning(false); setTimerSeconds(0); setActiveStep(0); }}
                    className="px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--accent)',
                      borderColor: 'var(--accent)',
                      color: 'white',
                    }}>
                    <span>{ex.icon}</span>
                    <span>{locale === 'zh' ? ex.nameZh : ex.nameEn}</span>
                    <span className="text-xs opacity-75">— {rec.reason}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-full text-sm border transition-colors"
              style={{
                backgroundColor: !selectedCategory ? 'var(--accent)' : 'var(--surface)',
                borderColor: !selectedCategory ? 'var(--accent)' : 'var(--border)',
                color: !selectedCategory ? 'white' : 'var(--text)',
              }}>
              {locale === 'zh' ? '全部' : 'All'}
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                style={{
                  backgroundColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--surface)',
                  borderColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--border)',
                  color: selectedCategory === cat.id ? 'white' : 'var(--text)',
                }}>
                {locale === 'zh' ? cat.nameZh : cat.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map(ex => (
              <button key={ex.id} onClick={() => { setSelectedExercise(ex); setIsTimerRunning(false); setTimerSeconds(0); setActiveStep(0); }}
                className="p-5 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{ex.icon}</span>
                  <div>
                    <h3 className="text-base font-semibold">
                      {locale === 'zh' ? ex.nameZh : ex.nameEn}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      ⏱ {ex.duration} | {locale === 'zh' ? ex.categoryZh : ex.categoryEn}
                    </p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? ex.descriptionZh : ex.descriptionEn}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg w-full max-w-lg overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            {/* Modal Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedExercise.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {locale === 'zh' ? selectedExercise.nameZh : selectedExercise.nameEn}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      ⏱ {selectedExercise.duration}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setSelectedExercise(null); setIsTimerRunning(false); }}
                  className="text-2xl leading-none" style={{ color: 'var(--muted)' }}>×</button>
              </div>
            </div>

            {/* Timer */}
            {isTimerRunning && (
              <div className="p-4 text-center border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }}>
                  {formatTime(timerSeconds)}
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '进行中...' : 'In progress...'}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4">
              {!isTimerRunning ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '说明' : 'Instructions'}
                    </h3>
                    <p className="text-sm mb-4">
                      {locale === 'zh' ? selectedExercise.descriptionZh : selectedExercise.descriptionEn}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '步骤' : 'Steps'}
                    </h3>
                    <ul className="space-y-2">
                      {Object.values(selectedExercise.instructions).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                            {i + 1}
                          </span>
                          <span>{locale === 'zh' ? step.zh : step.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={startExercise}
                    className="w-full text-white rounded px-4 py-3 font-medium"
                    style={{ backgroundColor: 'var(--accent)' }}>
                    {locale === 'zh' ? '开始练习' : 'Start Exercise'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current Step */}
                  <div className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                    <div className="text-6xl mb-4">
                      {activeStep % 2 === 0 ? '🧘' : '✨'}
                    </div>
                    <p className="text-lg font-medium">
                      {locale === 'zh'
                        ? selectedExercise.instructions[`step${activeStep + 1}` as keyof typeof selectedExercise.instructions]?.zh
                        : selectedExercise.instructions[`step${activeStep + 1}` as keyof typeof selectedExercise.instructions]?.en}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '步骤' : 'Step'} {activeStep + 1} / {Object.keys(selectedExercise.instructions).length}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button onClick={prevStep} disabled={activeStep === 0}
                      className="flex-1 py-2.5 rounded border disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                      ← {locale === 'zh' ? '上一步' : 'Previous'}
                    </button>
                    <button onClick={nextStep}
                      className="flex-1 py-2.5 rounded text-white"
                      style={{ backgroundColor: 'var(--accent)' }}>
                      {activeStep === Object.keys(selectedExercise.instructions).length - 1
                        ? (locale === 'zh' ? '完成' : 'Done')
                        : (locale === 'zh' ? '下一步' : 'Next')}
                    </button>
                  </div>
                  <button onClick={stopExercise}
                    className="w-full py-2 text-sm"
                    style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? '结束练习' : 'End Exercise'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
