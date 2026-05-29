import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { ChevronDown, X, ImagePlus } from 'lucide-react-taro'

export default function PublishPost() {
  const { userInfo } = useUserStore()
  const [circles, setCircles] = useState<any[]>([])
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [selectedCircleName, setSelectedCircleName] = useState('')
  const [showCirclePicker, setShowCirclePicker] = useState(false)
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    const preselectedCircleId = params?.circleId
    loadMyCircles(preselectedCircleId)
  }, [])

  const loadMyCircles = async (preselectedCircleId?: string) => {
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/users/circles',
        method: 'GET',
        data: { user_id: userId }
      })
      console.log('[PublishPost] my circles:', res.data)
      const list = res.data?.data || []
      setCircles(list)
      // 如果有预选圈子ID，直接选中
      if (preselectedCircleId) {
        const found = list.find((c: any) => c.id === preselectedCircleId)
        if (found) {
          setSelectedCircleId(found.id)
          setSelectedCircleName(found.name)
        }
      } else if (list.length > 0) {
        setSelectedCircleId(list[0].id)
        setSelectedCircleName(list[0].name)
      }
    } catch (e) {
      console.error('[PublishPost] loadMyCircles error:', e)
    }
  }

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
    if (!selectedCircleId) {
      Taro.showToast({ title: '请选择圈子', icon: 'none' })
      return
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/posts',
        method: 'POST',
        data: {
          circle_id: selectedCircleId,
          user_id: userId,
          content: content.trim(),
          tags,
          images: []
        }
      })
      console.log('[PublishPost] submit result:', res.data)
      if (res.data?.code === 200 || res.data?.data) {
        Taro.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '发布失败', icon: 'none' })
      }
    } catch (e) {
      console.error('[PublishPost] submit error:', e)
      Taro.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="h-full bg-neutral-50">
      {/* Circle Picker Modal */}
      {showCirclePicker && (
        <View className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowCirclePicker(false)}>
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-70vh overflow-y-auto">
            <Text className="block text-base font-bold text-neutral-900 mb-4">选择圈子</Text>
            {circles.map(c => (
              <Card
                key={c.id}
                className="mb-2"
                onClick={() => {
                  setSelectedCircleId(c.id)
                  setSelectedCircleName(c.name)
                  setShowCirclePicker(false)
                }}
              >
                <CardContent className="p-3 flex flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Text className="block text-sm font-bold text-orange-500">{c.name[0]}</Text>
                  </View>
                  <Text className="block text-sm font-medium text-neutral-900">{c.name}</Text>
                  {selectedCircleId === c.id && (
                    <Text className="block text-xs text-orange-500 ml-auto">已选</Text>
                  )}
                </CardContent>
              </Card>
            ))}
            {circles.length === 0 && (
              <Text className="block text-sm text-neutral-400 text-center py-8">还没有加入任何圈子</Text>
            )}
          </View>
        </View>
      )}

      <View className="p-4">
        {/* Circle Selection */}
        <Card className="mb-4" onClick={() => setShowCirclePicker(true)}>
          <CardContent className="p-3 flex flex-row items-center justify-between">
            <View>
              <Text className="block text-xs text-neutral-500 mb-1">发布到圈子</Text>
              <Text className="block text-sm font-semibold text-neutral-900">
                {selectedCircleName || '请选择圈子'}
              </Text>
            </View>
            <ChevronDown size={20} color="#737373" />
          </CardContent>
        </Card>

        {/* Content */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Textarea
            style={{ width: '100%', minHeight: '150px', backgroundColor: 'transparent', fontSize: '15px' }}
            placeholder="分享你的想法、经验和发现..."
            maxlength={2000}
            value={content}
            onInput={(e) => setContent(e.detail.value)}
          />
        </View>

        {/* Tags */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="block text-sm font-medium text-neutral-700 mb-3">话题标签</Text>
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex flex-row items-center gap-1">
                <Text className="text-xs">#{tag}</Text>
                <View onClick={() => handleRemoveTag(tag)}>
                  <X size={12} color="#737373" />
                </View>
              </Badge>
            ))}
          </View>
          <View className="flex flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="输入标签"
                value={tagInput}
                onInput={(e) => setTagInput(e.detail.value)}
                onConfirm={handleAddTag}
              />
            </View>
            <Button size="sm" onClick={handleAddTag}>
              <Text>添加</Text>
            </Button>
          </View>
        </View>

        {/* Image Placeholder */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="block text-sm font-medium text-neutral-700 mb-3">添加图片（最多9张）</Text>
          <View className="flex flex-row flex-wrap gap-2">
            <View className="w-20 h-20 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
              <ImagePlus size={24} color="#A3A3A3" />
            </View>
          </View>
        </View>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={submitting || !content.trim() || !selectedCircleId}
          onClick={handleSubmit}
        >
          <Text>{submitting ? '发布中...' : '发布动态'}</Text>
        </Button>
      </View>
    </View>
  )
}
