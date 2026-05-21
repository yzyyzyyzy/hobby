import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Search, Users, Flame } from 'lucide-react-taro'

interface CircleItem {
  id: string
  name: string
  category: string
  description: string
  member_count: number
  activity_score: number
  is_joined: boolean
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<CircleItem[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!keyword.trim()) return
    try {
      const res = await Network.request({
        url: `/api/circles?keyword=${encodeURIComponent(keyword)}`,
        method: 'GET',
      })
      console.log('Search results:', res.data)
      if (res.data?.data) setResults(res.data.data)
      setSearched(true)
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  const handleJoinCircle = async (circleId: string, isJoined: boolean) => {
    try {
      const url = isJoined ? '/api/circles/leave' : '/api/circles/join'
      const res = await Network.request({
        url,
        method: 'POST',
        data: { circle_id: circleId },
      })
      console.log('Join/leave response:', res.data)
      if (res.data?.data) {
        setResults((prev) =>
          prev.map((c) =>
            c.id === circleId
              ? { ...c, is_joined: !isJoined, member_count: c.member_count + (isJoined ? -1 : 1) }
              : c
          )
        )
        Taro.showToast({ title: isJoined ? '已退出' : '已加入', icon: 'success' })
      }
    } catch (err) {
      console.error('Join/leave failed:', err)
    }
  }

  return (
    <View className="h-full bg-neutral-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 pt-2 pb-3 flex flex-row items-center gap-2">
        <View className="flex-1 bg-neutral-100 rounded-xl px-3 py-2 flex flex-row items-center gap-2">
          <Search size={16} color="#737373" />
          <Input
            className="flex-1 bg-transparent text-sm"
            placeholder="搜索圈子、标签..."
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
            focus
          />
        </View>
        <Text className="text-sm text-orange-500 flex-shrink-0" onClick={() => Taro.navigateBack()}>取消</Text>
      </View>

      {/* 搜索结果 */}
      <View className="px-4 py-3 space-y-3">
        {searched && results.length === 0 ? (
          <View className="flex flex-col items-center py-12">
            <Text className="block text-3xl mb-2">🔍</Text>
            <Text className="block text-sm text-neutral-400">未找到相关圈子</Text>
          </View>
        ) : (
          results.map((circle) => (
            <Card key={circle.id}>
              <CardContent className="p-4">
                <View className="flex flex-row gap-3" onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circle.id}` })}>
                  <View className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Text className="block text-lg">{circle.name[0]}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-neutral-900">{circle.name}</Text>
                    <View className="flex flex-row items-center gap-2 mt-1">
                      <Users size={12} color="#737373" />
                      <Text className="block text-xs text-neutral-500">{circle.member_count}人</Text>
                      <Flame size={12} color="#F97316" />
                      <Text className="block text-xs text-orange-500">{circle.activity_score}</Text>
                    </View>
                  </View>
                  <Button
                    size="sm"
                    className={circle.is_joined ? 'bg-neutral-100' : 'bg-orange-500'}
                    onClick={(e) => { e.stopPropagation && e.stopPropagation(); handleJoinCircle(circle.id, circle.is_joined) }}
                  >
                    <Text className={circle.is_joined ? 'text-neutral-600' : 'text-white'}>
                      {circle.is_joined ? '已加入' : '加入'}
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  )
}
