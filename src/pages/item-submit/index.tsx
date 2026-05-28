import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'

export default function ItemSubmit() {
  const { userInfo } = useUserStore()
  const [itemId, setItemId] = useState('')
  const [submitType, setSubmitType] = useState<'correction' | 'new'>('correction')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [city, setCity] = useState('')
  const [intro, setIntro] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [season, setSeason] = useState('')
  const [highlights, setHighlights] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [resourceId, setResourceId] = useState('')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) setItemId(params.id)
    if (params?.resourceId) setResourceId(params.resourceId)
    if (params?.type === 'new') setSubmitType('new')
  }, [])

  const handleSubmit = async () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!content.trim() && submitType === 'correction') {
      Taro.showToast({ title: '请输入纠错内容', icon: 'none' })
      return
    }
    if (!title.trim() && submitType === 'new') {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const richContent: Record<string, any> = {}
      if (intro) richContent.intro = intro
      if (price) richContent.price = price
      if (location) richContent.location = location
      if (season) richContent.season = season
      if (highlights) richContent.highlights = highlights.split('\n').filter(Boolean)

      await Network.request({
        url: '/api/resources/item/submit',
        method: 'POST',
        data: {
          resource_id: resourceId || undefined,
          item_id: submitType === 'correction' ? parseInt(itemId) : undefined,
          title: submitType === 'new' ? title : undefined,
          city,
          rich_content: Object.keys(richContent).length > 0 ? richContent : undefined,
          correction_content: submitType === 'correction' ? content : undefined,
          submission_type: submitType,
          submitted_by: userInfo.id
        }
      })
      Taro.showToast({ title: '提交成功，等待审核', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e) {
      console.error('Submit failed:', e)
      Taro.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="bg-gray-50 min-h-screen p-4">
      <View className="bg-white rounded-xl p-4 gap-4">
        <Text className="block text-base font-semibold text-gray-800 mb-1">
          {submitType === 'correction' ? '提交纠错/补充' : '提交新增条目'}
        </Text>
        <Text className="block text-xs text-gray-400 mb-3">
          {submitType === 'correction' ? '您的内容将提交给主理人/管理员审核' : '新增条目需经主理人/管理员审核后展示'}
        </Text>

        {submitType === 'new' && (
          <View>
            <Text className="block text-sm text-gray-600 mb-1">标题 *</Text>
            <View className="bg-gray-50 rounded-lg px-3 py-2">
              <Input className="w-full bg-transparent" placeholder="如：XX滑雪场" value={title} onInput={e => setTitle(e.detail.value)} />
            </View>
          </View>
        )}

        <View>
          <Text className="block text-sm text-gray-600 mb-1">城市</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="如：吉林" value={city} onInput={e => setCity(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">简介</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="简要介绍" value={intro} onInput={e => setIntro(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">价格</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="如：平日280元/天" value={price} onInput={e => setPrice(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">地址</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="详细地址" value={location} onInput={e => setLocation(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">季节/时间</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="如：11月-次年3月" value={season} onInput={e => setSeason(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">亮点特色（每行一条）</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="每行一条亮点" value={highlights} onInput={e => setHighlights(e.detail.value)} />
          </View>
        </View>

        {submitType === 'correction' && (
          <View>
            <Text className="block text-sm text-gray-600 mb-1">纠错/补充内容 *</Text>
            <View className="bg-gray-50 rounded-lg px-3 py-2">
              <Input className="w-full bg-transparent" placeholder="请描述需要修正或补充的内容" value={content} onInput={e => setContent(e.detail.value)} />
            </View>
          </View>
        )}

        <Button className="w-full bg-orange-500 mt-4" onClick={handleSubmit} disabled={submitting}>
          <Text className="text-white">{submitting ? '提交中...' : '提交审核'}</Text>
        </Button>
      </View>
    </View>
  )
}
