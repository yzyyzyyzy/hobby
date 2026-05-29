import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { Bell } from 'lucide-react-taro'

export default function Notifications() {
  const { userInfo } = useUserStore()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      if (!userId) {
        setLoading(false)
        return
      }
      const res = await Network.request({
        url: '/api/messages',
        method: 'GET',
        data: { user_id: userId },
      })
      console.log('[Notifications] messages:', res.data)
      const list = res.data?.data || []
      setMessages(list)
    } catch (e) {
      console.error('[Notifications] load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 px-4 pt-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl mb-3" />
        ))}
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-lg font-bold text-gray-900">消息通知</Text>
      </View>

      {!userInfo?.id ? (
        <View className="flex flex-col items-center justify-center py-20">
          <Bell size={48} color="#d1d5db" />
          <Text className="block text-gray-400 mt-4">登录后查看消息通知</Text>
        </View>
      ) : messages.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-20">
          <Bell size={48} color="#d1d5db" />
          <Text className="block text-gray-400 mt-4">暂无消息</Text>
        </View>
      ) : (
        <View className="px-4 pb-4">
          {messages.map((msg) => (
            <Card key={msg.id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex flex-row items-start gap-3">
                  <View className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Bell size={14} color="#F97316" />
                  </View>
                  <View className="flex flex-col flex-1">
                    <Text className="block text-sm font-medium text-gray-900">{msg.title || '系统通知'}</Text>
                    <Text className="block text-sm text-gray-600 mt-1">{msg.content}</Text>
                    <Text className="block text-xs text-gray-400 mt-2">{formatTime(msg.created_at)}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}
