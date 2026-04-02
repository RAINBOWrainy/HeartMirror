/**
 * Crisis Page
 * 危机支持页面 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import {
  Phone,
  AlertTriangle,
  Shield,
  Heart,
} from 'lucide-react'
import { useRequest } from 'ahooks'
import { crisisApi } from '@/services/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Alert,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui'
import { cn } from '@/lib/utils'

const Crisis: React.FC = () => {
  const { data: resources } = useRequest(() => crisisApi.getResources())
  const { data: exercises } = useRequest(() => crisisApi.getGroundingExercises())

  return (
    <div className="max-w-3xl mx-auto">
      {/* 紧急提醒 */}
      <Alert variant="error" className="mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium text-foreground">如果您正处于紧急危机状态</p>
            <p className="text-muted-foreground mt-1">
              请立即拨打心理援助热线：<strong className="text-foreground">400-161-9995</strong>
            </p>
            <p className="text-muted-foreground">
              或紧急求助：<strong className="text-foreground">120</strong> / <strong className="text-foreground">110</strong>
            </p>
          </div>
        </div>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 心理援助热线 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              心理援助热线
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(resources?.data || []).map((item: any) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <Badge variant="secondary">{item.phone}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.region} | {item.available_hours}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => window.open(`tel:${item.phone}`, '_self')}
                >
                  拨打
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 即时帮助 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              即时帮助
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="info">
              <p className="font-medium text-foreground">您并不孤单</p>
              <p className="text-muted-foreground mt-1">
                困难时刻是暂时的，帮助就在身边。以下是一些可以立即尝试的方法。
              </p>
            </Alert>
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.open('tel:400-161-9995', '_self')}
            >
              拨打全国心理援助热线
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => window.open('tel:120', '_self')}
            >
              拨打急救电话 120
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 接地练习 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            接地练习
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            当您感到焦虑或恐慌时，这些练习可以帮助您平静下来。
          </p>
          <Accordion type="single" collapsible>
            {exercises?.data?.exercises?.map((exercise: any, index: number) => (
              <AccordionItem key={index} value={index.toString()}>
                <AccordionTrigger>{exercise.name}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">{exercise.description}</p>
                  <p className="font-medium text-foreground mb-2">步骤：</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    {exercise.steps.map((step: string, i: number) => (
                      <li key={i} className="text-foreground">{step}</li>
                    ))}
                  </ol>
                  <p className="text-sm text-muted-foreground mt-3">
                    预计时间：{exercise.duration}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* 安全计划 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>安全计划</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            制定个人安全计划可以帮助您在危机时刻知道该做什么。
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: '识别警示信号', desc: '列出可能触发危机的情况' },
              { step: 2, title: '内部应对策略', desc: '列出可以自我安抚的活动' },
              { step: 3, title: '社交支持', desc: '列出可以联系的人' },
              { step: 4, title: '专业帮助', desc: '列出可以联系的专业机构' },
              { step: 5, title: '安全环境', desc: '确保环境安全，移除危险物品' },
            ].map((item) => (
              <div
                key={item.step}
                className="p-3 rounded-lg border border-border bg-surface"
              >
                <p className="font-medium text-foreground">
                  步骤 {item.step}：{item.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Crisis