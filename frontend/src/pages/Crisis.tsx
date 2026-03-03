import React from 'react'
import { Card, Typography, List, Button, Space, Alert, Divider, Collapse, Row, Col } from 'antd'
import {
  PhoneOutlined,
  AlertOutlined,
  SafetyOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { crisisApi } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

const Crisis: React.FC = () => {
  const { data: resources } = useRequest(() => crisisApi.getResources())
  const { data: exercises } = useRequest(() => crisisApi.getGroundingExercises())

  return (
    <div>
      <Alert
        message="如果您正处于紧急危机状态"
        description={
          <div>
            <Paragraph style={{ margin: 0 }}>
              请立即拨打心理援助热线：<Text strong>400-161-9995</Text>
            </Paragraph>
            <Paragraph style={{ margin: 0 }}>
              或紧急求助：<Text strong>120</Text> / <Text strong>110</Text>
            </Paragraph>
          </div>
        }
        type="error"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<><PhoneOutlined /> 心理援助热线</>}>
            <List
              dataSource={resources?.data || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        <Text code>{item.phone}</Text>
                      </Space>
                    }
                    description={`${item.region} | ${item.available_hours}`}
                  />
                  <Button type="primary" href={`tel:${item.phone}`}>
                    拨打
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<><HeartOutlined /> 即时帮助</>}>
            <Alert
              message="您并不孤单"
              description="困难时刻是暂时的，帮助就在身边。以下是一些可以立即尝试的方法。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block size="large" type="primary" href="tel:400-161-9995">
                拨打全国心理援助热线
              </Button>
              <Button block size="large" href="tel:120">
                拨打急救电话 120
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={<><SafetyOutlined /> 接地练习</>} style={{ marginTop: 16 }}>
        <Paragraph type="secondary">
          当您感到焦虑或恐慌时，这些练习可以帮助您平静下来。
        </Paragraph>
        <Collapse accordion>
          {exercises?.data?.exercises?.map((exercise: any, index: number) => (
            <Panel header={exercise.name} key={index}>
              <Paragraph type="secondary">{exercise.description}</Paragraph>
              <Text strong>步骤：</Text>
              <ol>
                {exercise.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <Text type="secondary">预计时间：{exercise.duration}</Text>
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Card title="安全计划" style={{ marginTop: 16 }}>
        <Paragraph>
          制定个人安全计划可以帮助您在危机时刻知道该做什么。
        </Paragraph>
        <List
          size="small"
          bordered
          dataSource={[
            { step: 1, title: '识别警示信号', desc: '列出可能触发危机的情况' },
            { step: 2, title: '内部应对策略', desc: '列出可以自我安抚的活动' },
            { step: 3, title: '社交支持', desc: '列出可以联系的人' },
            { step: 4, title: '专业帮助', desc: '列出可以联系的专业机构' },
            { step: 5, title: '安全环境', desc: '确保环境安全，移除危险物品' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <Text strong>步骤 {item.step}：{item.title}</Text>
              <br />
              <Text type="secondary">{item.desc}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Crisis