import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { ChevronDown } from 'lucide-react-taro'

export default function SubmitResource() {
  const { userInfo } = useUserStore()
  const [circles, setCircles] = useState<any[]>([])
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [selectedCircleName, setSelectedCircleName] = useState('')
  const [showCirclePicker, setShowCirclePicker] = useState(false)

  const [title, setTitle] = useState('')
  const [suggestionType, setSuggestionType] = useState<'add' | 'correction'>('add')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMyCircles()
  }, [])

  const loadMyCircles = async () => {
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/users/circles',
        method: 'GET',
        data: { user_id: userId }
      })
      const list = res.data?.data || []
      setCircles(list)
      if (list.length > 0) {
        setSelectedCircleId(list[0].id)
        setSelectedCircleName(list[0].name)
      }
    } catch (e) {
      console.error('[SubmitResource] loadMyCircles error:', e)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCircleId) { Taro.showToast({ title: '请选择圈子', icon: 'none' }); return }
    if (!title.trim()) { Taro.showToast({ title: '请填写标题', icon: 'none' }); return }
    if (!content.trim()) { Taro.showToast({ title: '请填写内容', icon: 'none' }); return }

    setSubmitting(true)
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/resources/submissions',
        method: 'POST',
        data: {
          circle_id: selectedCircleId,
          submitted_by: userId,
          title: title.trim(),
          submission_type: suggestionType,
          content: content.trim()
        }
      })
      if (res.data?.data) {
        Taro.showToast({ title: '提交成功，等待审核', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '提交失败', icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="h-full bg-neutral-50">
      {showCirclePicker && (
        <View className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCirclePicker(false)}>
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-70vh overflow-y-auto">
            <Text className="block text-base font-bold text-neutral-900 mb-4">选择圈子</Text>
            {circles.map(c => (
              <Card key={c.id} className="mb-2" onClick={() => { setSelectedCircleId(c.id); setSelectedCircleName(c.name); setShowCirclePicker(false) }}>
                <CardContent className="p-3 flex flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Text className="block text-sm font-bold text-orange-500">{c.name[0]}</Text>
                  </View>
                  <Text className="block text-sm font-medium text-neutral-900">{c.name}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      )}

      <View className="p-4">
        <Card className="mb-4" onClick={() => setShowCirclePicker(true)}>
          <CardContent className="p-3 flex flex-row items-center justify-between">
            <View>
              <Text className="block text-xs text-neutral-500 mb-1">提交到圈子</Text>
              <Text className="block text-sm font-semibold text-neutral-900">{selectedCircleName || '请选择圈子'}</Text>
            </View>
            <ChevronDown size={20} color="#737373" />
          </CardContent>
        </Card>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="block text-sm font-medium text-neutral-700 mb-3">提交类型</Text>
          <View className="flex flex-row gap-3">
            <View
              className={`flex-1 p-3 rounded-lg border-2 ${suggestionType === 'add' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 bg-white'}`}
              onClick={() => setSuggestionType('add')}
            >
              <Text className={`block text-sm font-medium ${suggestionType === 'add' ? 'text-orange-600' : 'text-neutral-600'}`}>补充资料</Text>
            </View>
            <View
              className={`flex-1 p-3 rounded-lg border-2 ${suggestionType === 'correction' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 bg-white'}`}
              onClick={() => setSuggestionType('correction')}
            >
              <Text className={`block text-sm font-medium ${suggestionType === 'correction' ? 'text-orange-600' : 'text-neutral-600'}`}>纠错</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 space-y-4">
          <View>
            <Text className="block text-sm font-medium text-neutral-700 mb-1">标题</Text>
            <View className="bg-neutral-50 rounded-lg px-3 py-2">
              <Input placeholder="补充/纠错的内容标题" value={title} onInput={(e) => setTitle(e.detail.value)} />
            </View>
          </View>
          <View>
            <Text className="block text-sm font-medium text-neutral-700 mb-1">详细说明</Text>
            <Textarea
              style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
              placeholder="请详细描述您要补充或纠错的内容..."
              value={content}
              onInput={(e) => setContent(e.detail.value)}
            />
          </View>
        </View>

        <Button className="w-full" disabled={submitting || !title.trim() || !content.trim()} onClick={handleSubmit}>
          <Text>{submitting ? '提交中...' : '提交审核'}</Text>
        </Button>
      </View>
    </View>
  )
}
