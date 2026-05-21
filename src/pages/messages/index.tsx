import { View, Text } from '@tarojs/components'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { MessageCircle, UserPlus, Megaphone, Info } from 'lucide-react-taro'

interface MessageItem {
  id: string
  type: string
  title: string
  content: string
  related_id: string
  circle_id: string
  circle_name: string
  is_read: boolean
  created_at: string
}

export default function Messages() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const res = await Network.request({ url: '/api/messages', method: 'GET' })
      console.log('Messages:', res.data)
      if (res.data?.data) setMessages(res.data.data)
    } catch (err) {
      console.error('Load messages failed:', err)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await Network.request({ url: `/api/messages/${id}/read`, method: 'PUT' })
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      )
    } catch (err) {
      console.error('Mark read failed:', err)
    }
  }

  const typeIcon: Record<string, { icon: typeof MessageCircle; color: string }> = {
    comment: { icon: MessageCircle, color: '#3B82F6' },
    registration: { icon: UserPlus, color: '#22C55E' },
    announcement: { icon: Megaphone, color: '#F97316' },
    system: { icon: Info, color: '#737373' },
  }

  const filteredMessages = activeTab === 'all'
    ? messages
    : messages.filter((m) => m.type === activeTab)

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <View className="h-full bg-neutral-50">
      {/* 顶部 */}
      <View className="bg-white px-4 pt-4 pb-2">
        <View className="flex flex-row items-center justify-between">
          <Text className="block text-xl font-bold text-neutral-900">消息</Text>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount}条未读</Badge>
          )}
        </View>
      </View>

      {/* 分类Tab */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">全部</TabsTrigger>
          <TabsTrigger value="comment" className="flex-1">评论</TabsTrigger>
          <TabsTrigger value="registration" className="flex-1">报名</TabsTrigger>
          <TabsTrigger value="system" className="flex-1">系统</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <View className="px-4 py-3 space-y-2">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => {
                const iconInfo = typeIcon[msg.type] || typeIcon.system
                const IconComp = iconInfo.icon
                return (
                  <Card
                    key={msg.id}
                    className={msg.is_read ? 'opacity-70' : ''}
                    onClick={() => {
                      markAsRead(msg.id)
                      if (msg.related_id) {
                        if (msg.type === 'comment') {
                          Taro.navigateTo({ url: `/pages/post-detail/index?id=${msg.related_id}` })
                        } else if (msg.type === 'registration') {
                          Taro.navigateTo({ url: `/pages/activity-detail/index?id=${msg.related_id}` })
                        }
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <View className="flex flex-row items-start gap-3">
                        <View className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${iconInfo.color}15` }}>
                          <IconComp size={16} color={iconInfo.color} />
                        </View>
                        <View className="flex-1 min-w-0">
                          <View className="flex flex-row items-center justify-between">
                            <Text className="block text-sm font-semibold text-neutral-900">{msg.title}</Text>
                            {!msg.is_read && <View className="w-2 h-2 rounded-full bg-orange-500" />}
                          </View>
                          <Text className="block text-xs text-neutral-500 mt-1 line-clamp-2">{msg.content}</Text>
                          <Text className="block text-xs text-neutral-400 mt-1">{msg.created_at?.slice(5, 16)}</Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">📭</Text>
                <Text className="block text-sm text-neutral-400">暂无消息</Text>
              </View>
            )}
          </View>
        </TabsContent>
      </Tabs>

      {/* 底部声明 */}
      <View className="px-4 py-4">
        <Text className="block text-xs text-neutral-400 text-center">
          不开放用户间私信 | 免打扰设置请在个人中心调整
        </Text>
      </View>
    </View>
  )
}
