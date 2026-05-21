import { View, Text } from '@tarojs/components'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { MapPin, ExternalLink, FileText, Flag } from 'lucide-react-taro'

interface ResourceDetail {
  id: string
  title: string
  resource_type: string
  content: Record<string, unknown>
  cover_url: string
  is_template: boolean
  circle_name: string
}

export default function ResourceDetail() {
  const { isLoggedIn } = useUserStore()
  const [resource, setResource] = useState<ResourceDetail | null>(null)

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) loadResource(id)
  }, [])

  const loadResource = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/${id}`, method: 'GET' })
      console.log('Resource detail:', res.data)
      if (res.data?.data) setResource(res.data.data)
    } catch (err) {
      console.error('Load resource failed:', err)
    }
  }

  const [correctionText, setCorrectionText] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)

  const handleSubmitCorrection = async () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setShowCorrection(true)
  }

  const doSubmitCorrection = async () => {
    if (!correctionText.trim() || !resource) return
    try {
      await Network.request({
        url: `/api/resources/${resource.id}/submissions`,
        method: 'POST',
        data: {
          user_id: useUserStore.getState().userInfo?.id,
          content: correctionText,
          type: 'correction',
        },
      })
      Taro.showToast({ title: '已提交审核', icon: 'success' })
      setCorrectionText('')
      setShowCorrection(false)
    } catch {
      Taro.showToast({ title: '提交失败', icon: 'none' })
    }
  }

  const handleReport = () => {
    Taro.showModal({
      title: '举报',
      content: '确定举报此内容？',
      success: async (res) => {
        if (res.confirm && resource) {
          try {
            await Network.request({
              url: '/api/reports',
              method: 'POST',
              data: { target_type: 'resource', target_id: resource.id, reason: 'inappropriate' },
            })
            Taro.showToast({ title: '已举报', icon: 'success' })
          } catch {
            Taro.showToast({ title: '举报失败', icon: 'none' })
          }
        }
      },
    })
  }

  if (!resource) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="block text-sm text-neutral-400">加载中...</Text>
      </View>
    )
  }

  // 解析结构化内容
  const contentData = resource.content || {}
  const parameters = (contentData.parameters || []) as { key: string; value: string }[]
  const location = contentData.location as string | undefined
  const externalLinks = (contentData.external_links || []) as { title: string; url: string }[]

  return (
    <View className="h-full bg-neutral-50 pb-4">
      {/* 标题区域 */}
      <View className="bg-white px-4 py-4">
        <View className="flex flex-row items-start justify-between">
          <Text className="block text-lg font-bold text-neutral-900 flex-1">{resource.title}</Text>
          <Flag size={16} color="#737373" onClick={handleReport} />
        </View>
        <View className="flex flex-row items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">{resource.resource_type}</Badge>
          {resource.is_template && <Badge className="bg-blue-50 text-blue-600">模板</Badge>}
        </View>
      </View>

      <View className="h-2" />

      {/* 参数表格 */}
      {parameters.length > 0 && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <FileText size={16} color="#F97316" />
              <Text className="block text-sm font-semibold text-neutral-900">参数信息</Text>
            </View>
            <View className="space-y-2">
              {parameters.map((p, i) => (
                <View key={i} className="flex flex-row items-center py-2 border-b border-neutral-100">
                  <Text className="block text-xs text-neutral-500 w-24 flex-shrink-0">{p.key}</Text>
                  <Text className="block text-sm text-neutral-800 flex-1">{p.value}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      <View className="h-2" />

      {/* 地图定位 */}
      {location && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-2">
              <MapPin size={16} color="#F97316" />
              <Text className="block text-sm font-semibold text-neutral-900">位置</Text>
            </View>
            <Text className="block text-sm text-neutral-700">{location}</Text>
          </CardContent>
        </Card>
      )}

      <View className="h-2" />

      {/* 外部链接 */}
      {externalLinks.length > 0 && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <ExternalLink size={16} color="#F97316" />
              <Text className="block text-sm font-semibold text-neutral-900">相关链接</Text>
            </View>
            <View className="space-y-2">
              {externalLinks.map((link, i) => (
                <View key={i} className="flex flex-row items-center gap-2 py-1">
                  <Text className="block text-sm text-blue-500">{link.title}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      <View className="h-2" />

      {/* 提交补充/纠错 */}
      <View className="mx-4">
        {!showCorrection ? (
          <Button variant="outline" className="w-full rounded-xl" onClick={handleSubmitCorrection}>
            <Text>提交补充/纠错</Text>
          </Button>
        ) : (
          <View className="space-y-3">
            <View className="bg-white rounded-xl p-3 border border-neutral-200">
              <Textarea
                className="w-full"
                placeholder="请输入补充内容或纠错说明..."
                value={correctionText}
                onInput={(e) => setCorrectionText(e.detail.value)}
                maxlength={500}
              />
            </View>
            <View className="flex flex-row gap-2">
              <View className="flex-1">
                <Button variant="outline" className="w-full" onClick={() => setShowCorrection(false)}>
                  <Text>取消</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button className="w-full bg-orange-500 text-white" onClick={doSubmitCorrection}>
                  <Text className="text-white">提交</Text>
                </Button>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 底部声明 */}
      <View className="px-4 py-4">
        <Text className="block text-xs text-neutral-400 text-center">
          资料由用户贡献，仅供参考 | 违规内容请举报
        </Text>
      </View>
    </View>
  )
}
