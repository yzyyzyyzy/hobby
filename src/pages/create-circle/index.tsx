import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useUserStore } from '@/store/user-store'

const CATEGORIES = [
  { key: '运动', label: '运动' },
  { key: '户外', label: '户外' },
  { key: '文化', label: '文化' },
  { key: '生活', label: '生活' },
]

export default function CreateCircle() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('运动')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { userInfo } = useUserStore()

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!name.trim()) {
      Taro.showToast({ title: '请输入圈子名称', icon: 'none' })
      return
    }
    if (!category) {
      Taro.showToast({ title: '请选择圈子分类', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/circles/apply',
        method: 'POST',
        data: {
          applicant_id: userInfo.id,
          name: name.trim(),
          description: description.trim(),
          category,
          tags,
        },
      })
      console.log('Apply to create circle response:', res.data)
      if (res.data?.code === 200 || res.data?.data) {
        Taro.showToast({ title: '申请已提交，等待管理员审批', icon: 'none', duration: 2000 })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('Apply to create circle failed:', err)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="h-full bg-neutral-50 p-4 space-y-4">
      {/* 圈子名称 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Text className="block text-sm font-semibold text-neutral-900">圈子名称</Text>
          <View className="bg-neutral-50 rounded-xl px-4 py-3">
            <Input
              className="w-full bg-transparent"
              placeholder="请输入圈子名称"
              value={name}
              onInput={(e) => setName(e.detail.value)}
              maxlength={20}
            />
          </View>
          <Text className="block text-xs text-neutral-400">{name.length}/20</Text>
        </CardContent>
      </Card>

      {/* 圈子分类 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Text className="block text-sm font-semibold text-neutral-900">圈子分类</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <View
                key={cat.key}
                className={`px-4 py-2 rounded-full ${category === cat.key ? 'bg-orange-500' : 'bg-neutral-100'}`}
                onClick={() => setCategory(cat.key)}
              >
                <Text className={`block text-sm ${category === cat.key ? 'text-white' : 'text-neutral-600'}`}>
                  {cat.label}
                </Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* 圈子描述 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Text className="block text-sm font-semibold text-neutral-900">圈子描述</Text>
          <View className="bg-neutral-50 rounded-xl px-4 py-3">
            <Input
              className="w-full bg-transparent"
              placeholder="简单描述这个圈子的定位和内容"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
            />
          </View>
        </CardContent>
      </Card>

      {/* 标签 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Text className="block text-sm font-semibold text-neutral-900">标签（最多5个）</Text>
          <View className="flex flex-row items-center gap-2">
            <View className="flex-1 bg-neutral-50 rounded-xl px-4 py-3">
              <Input
                className="w-full bg-transparent"
                placeholder="输入标签后点击添加"
                value={tagInput}
                onInput={(e) => setTagInput(e.detail.value)}
                onConfirm={handleAddTag}
              />
            </View>
            <View className="flex-shrink-0">
              <Button size="sm" onClick={handleAddTag}>
                <Text className="text-white text-xs">添加</Text>
              </Button>
            </View>
          </View>
          {tags.length > 0 && (
            <View className="flex flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="flex flex-row items-center gap-1 bg-orange-50 px-3 py-1 rounded-full"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <Text className="block text-xs text-orange-600">{tag}</Text>
                  <Text className="block text-xs text-orange-400">×</Text>
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* 提示 */}
      <View className="bg-orange-50 rounded-xl p-4">
        <Text className="block text-xs text-orange-700">
          提交后管理员将审批您的申请。通过后您将成为该圈子的主理人，可管理圈子内容和成员。审批结果将通过消息通知您。
        </Text>
      </View>

      {/* 提交按钮 */}
      <Button
        className="w-full bg-orange-500 py-3 rounded-xl"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Text className="text-white font-semibold">{submitting ? '提交中...' : '提交申请'}</Text>
      </Button>
    </View>
  )
}
