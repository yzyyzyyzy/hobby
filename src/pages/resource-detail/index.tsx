import { View, ScrollView, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Trophy, Image, ListChecks, Star, ExternalLink, MapPin, TextCursorInput } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'

interface Resource {
  id: string; title: string; template_type: string; description: string;
  template_data: any; sort_order: number; circle_id: string;
}

export default function ResourceDetail() {
  const [resource, setResource] = useState<Resource | null>(null)
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const stored = Taro.getStorageSync('user_id')
    if (stored) setUserId(stored)
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) loadResource(id)
  }, [])

  const loadResource = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/${id}` })
      console.log('Resource detail:', res.data)
      if (res.data?.data) setResource(res.data.data)
    } catch (err) { console.error('Load resource failed:', err) }
  }

  const handleSubmitCorrection = async () => {
    if (!resource || !correctionText.trim()) return
    try {
      await Network.request({
        url: `/api/resources/submit`,
        method: 'POST',
        data: {
          resource_id: resource.id,
          circle_id: resource.circle_id,
          user_id: userId,
          type: 'correction',
          content: correctionText,
        },
      })
      Taro.showToast({ title: '已提交纠错，等待审核', icon: 'success' })
      setShowCorrection(false)
      setCorrectionText('')
    } catch (err) {
      Taro.showToast({ title: '提交失败', icon: 'none' })
    }
  }

  // 排行榜详情渲染
  const renderRankingDetail = () => {
    const items = resource?.template_data?.items || []
    return (
      <View>
        {items.map((item: any, idx: number) => (
          <Card key={idx} className="mb-3">
            <CardContent className="p-4">
              <View className="flex flex-row items-start gap-3">
                <View
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.rank === 1 ? '#FCD34D' : item.rank === 2 ? '#D1D5DB' : item.rank === 3 ? '#FB923C' : '#F5F5F5' }}
                >
                  <Text className="block text-sm font-bold" style={{ color: item.rank <= 3 ? '#fff' : '#737373' }}>
                    {item.rank}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="block text-base font-semibold text-neutral-900">{item.title}</Text>
                    {item.score != null && (
                      <View className="flex flex-row items-center gap-1">
                        <Star size={14} color="#F59E0B" />
                        <Text className="block text-sm font-semibold text-orange-500">{item.score}</Text>
                      </View>
                    )}
                  </View>
                  {item.subtitle && <Text className="block text-sm text-neutral-500 mt-1">{item.subtitle}</Text>}
                  {item.detail && <Text className="block text-sm text-neutral-600 mt-2">{item.detail}</Text>}
                  {item.location && (
                    <View className="flex flex-row items-center gap-1 mt-2">
                      <MapPin size={12} color="#737373" />
                      <Text className="block text-xs text-neutral-400">{item.location}</Text>
                    </View>
                  )}
                  {item.link && (
                    <View className="mt-2">
                      <Badge className="bg-orange-50 text-orange-600">
                        <View className="flex flex-row items-center gap-1">
                          <ExternalLink size={10} color="#F97316" />
                          <Text className="text-orange-600 text-xs">查看链接</Text>
                        </View>
                      </Badge>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    )
  }

  // 图集详情渲染
  const renderGalleryDetail = () => {
    const items = resource?.template_data?.items || []
    return (
      <View>
        <View className="grid grid-cols-2 gap-3">
          {items.map((item: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="p-3">
                <View className="w-full aspect-square bg-neutral-100 rounded-lg flex items-center justify-center mb-2">
                  {item.image_url ? (
                    <View className="w-full h-full bg-orange-50 rounded-lg flex items-center justify-center">
                      <Text className="block text-4xl">{item.title?.charAt(0) || '?'}</Text>
                    </View>
                  ) : (
                    <View className="flex flex-col items-center">
                      <Image size={32} color="#D4D4D4" />
                      <Text className="block text-xs text-neutral-300 mt-1">暂无图片</Text>
                    </View>
                  )}
                </View>
                <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
                {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
                {item.description && <Text className="block text-xs text-neutral-500 mt-2">{item.description}</Text>}
                {item.link && (
                  <View className="mt-2">
                    <Badge className="bg-orange-50 text-orange-600">
                      <View className="flex flex-row items-center gap-1">
                        <ExternalLink size={10} color="#F97316" />
                        <Text className="text-orange-600 text-xs">了解更多</Text>
                      </View>
                    </Badge>
                  </View>
                )}
              </CardContent>
            </Card>
          ))}
        </View>
      </View>
    )
  }

  // 列表详情渲染
  const renderListDetail = () => {
    const items = resource?.template_data?.items || []
    return (
      <View>
        {items.map((item: any, idx: number) => (
          <Card key={idx} className="mb-2">
            <CardContent className="p-4">
              <View className="flex flex-row items-start gap-3">
                <View className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Text className="block text-sm font-semibold text-orange-500">{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
                  {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
                  {item.description && <Text className="block text-xs text-neutral-500 mt-2">{item.description}</Text>}
                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <View className="flex flex-row flex-wrap gap-1 mt-2">
                      {item.tags.map((tag: string, ti: number) => (
                        <Badge key={ti} className="bg-orange-50 text-orange-600 text-xs">{tag}</Badge>
                      ))}
                    </View>
                  )}
                  {item.link && (
                    <View className="mt-2">
                      <Badge className="bg-orange-50 text-orange-600">
                        <View className="flex flex-row items-center gap-1">
                          <ExternalLink size={10} color="#F97316" />
                          <Text className="text-orange-600 text-xs">查看详情</Text>
                        </View>
                      </Badge>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    )
  }

  const templateIcon = (type: string) => {
    switch (type) {
      case 'ranking': return <Trophy size={20} color="#F97316" />
      case 'gallery': return <Image size={20} color="#F97316" />
      case 'list': return <ListChecks size={20} color="#F97316" />
      default: return null
    }
  }

  const templateLabel = (type: string) => {
    switch (type) {
      case 'ranking': return '排行榜'
      case 'gallery': return '图集'
      case 'list': return '列表'
      default: return type
    }
  }

  if (!resource) {
    return (
      <View className="flex items-center justify-center h-screen bg-neutral-50">
        <Text className="block text-neutral-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-neutral-50 pb-16">
      {/* Header */}
      <View className="bg-white px-4 pt-3 pb-4">
        <View className="flex flex-row items-center gap-2 mb-2">
          {templateIcon(resource.template_type)}
          <Text className="block text-lg font-bold text-neutral-900">{resource.title}</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Badge className="bg-orange-50 text-orange-600">{templateLabel(resource.template_type)}</Badge>
          {resource.description && (
            <Text className="block text-xs text-neutral-500">{resource.description}</Text>
          )}
        </View>
      </View>

      <Separator />

      {/* Content */}
      <ScrollView scrollY className="px-4 py-3">
        {resource.template_type === 'ranking' && renderRankingDetail()}
        {resource.template_type === 'gallery' && renderGalleryDetail()}
        {resource.template_type === 'list' && renderListDetail()}
      </ScrollView>

      {/* Correction Section */}
      <View className="px-4 py-3 bg-white border-t border-neutral-100">
        {!showCorrection ? (
          <Button size="sm" className="bg-neutral-100 text-neutral-600 w-full" onClick={() => setShowCorrection(true)}>
            <View className="flex flex-row items-center gap-1">
              <TextCursorInput size={14} color="#737373" />
              <Text className="text-neutral-600 text-xs">提交纠错/补充</Text>
            </View>
          </Button>
        ) : (
          <View className="space-y-2">
            <View className="bg-neutral-50 rounded-xl px-4 py-3">
              <Text className="block text-xs text-neutral-400 mb-1">请描述需要纠错或补充的内容：</Text>
              <View className="bg-white rounded-lg px-3 py-2">
                <Input
                  placeholder="输入纠错或补充内容..."
                  value={correctionText}
                  onInput={(e) => setCorrectionText(e.detail.value)}
                />
              </View>
            </View>
            <View className="flex flex-row gap-2">
              <Button size="sm" className="flex-1 bg-neutral-100 text-neutral-600" onClick={() => setShowCorrection(false)}>
                <Text className="text-neutral-600 text-xs">取消</Text>
              </Button>
              <Button size="sm" className="flex-1 bg-orange-500 text-white" onClick={handleSubmitCorrection}>
                <Text className="text-white text-xs">提交</Text>
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* 底部免责声明 */}
      <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
        <Text className="block text-xs text-neutral-300 text-center">
          免责声明 | 隐私政策 | 用户协议
        </Text>
      </View>
    </View>
  )
}
