import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { X, Plus } from 'lucide-react-taro'

const INTEREST_OPTIONS = [
  '滑雪', '登山', '跑步', '骑行', '游泳', '篮球', '足球', '羽毛球',
  '摄影', '绘画', '音乐', '读书', '写作', '手账', '电影', '咖啡',
  '美食', '旅行', '露营', '钓鱼', '园艺', '瑜伽', '攀岩', '冲浪',
]

export default function EditProfile() {
  const { userInfo, setUserInfo } = useUserStore()
  const [nickname, setNickname] = useState(userInfo?.nickname || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(userInfo?.interest_tags || [])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!userInfo?.id) return
    try {
      const res = await Network.request({
        url: '/api/users/profile',
        method: 'PUT',
        data: { nickname, interest_tags: selectedTags },
      })
      console.log('Update profile response:', res.data)
      if (res.data?.data) {
        setUserInfo({ ...userInfo, nickname, interest_tags: selectedTags })
        Taro.showToast({ title: '保存成功', icon: 'success' })
        Taro.navigateBack()
      }
    } catch (err) {
      console.error('Update profile failed:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  return (
    <View className="h-full bg-neutral-50 px-4 pt-4">
      {/* 昵称编辑 */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="block text-sm font-semibold text-neutral-900 mb-2">昵称</Text>
        <View className="bg-neutral-50 rounded-lg px-3 py-2">
          <Input
            className="w-full bg-transparent"
            placeholder="请输入昵称"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>
      </View>

      {/* 兴趣标签编辑 */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="block text-sm font-semibold text-neutral-900 mb-2">兴趣标签</Text>
        <Text className="block text-xs text-neutral-500 mb-3">选择你的兴趣，用于推荐与匹配</Text>

        {/* 已选标签 */}
        {selectedTags.length > 0 && (
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <Badge key={tag} className="bg-orange-500 text-white pr-1">
                <Text className="text-white">{tag}</Text>
                <View onClick={() => toggleTag(tag)} className="ml-1">
                  <X size={12} color="#ffffff" />
                </View>
              </Badge>
            ))}
          </View>
        )}

        <Separator className="my-3" />

        {/* 可选标签 */}
        <View className="flex flex-row flex-wrap gap-2">
          {INTEREST_OPTIONS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className={selectedTags.includes(tag) ? 'bg-orange-500 text-white' : ''}
              onClick={() => toggleTag(tag)}
            >
              {selectedTags.includes(tag) ? tag : (
                <View className="flex flex-row items-center gap-1">
                  <Plus size={10} color={selectedTags.includes(tag) ? '#fff' : '#737373'} />
                  <Text>{tag}</Text>
                </View>
              )}
            </Badge>
          ))}
        </View>
      </View>

      {/* 保存按钮 */}
      <Button
        className="w-full bg-orange-500 text-white rounded-xl py-3"
        onClick={handleSave}
      >
        <Text className="text-white font-medium">保存</Text>
      </Button>
    </View>
  )
}

function Separator({ className }: { className?: string }) {
  return <View className={`bg-neutral-200 h-px ${className || 'my-2'}`} />
}
