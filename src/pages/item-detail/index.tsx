import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Heart, MapPin, Calendar, ChevronRight, Pencil, CirclePlus, MessageSquare } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'

interface RichContent {
  intro?: string
  season?: string
  price?: string
  location?: string
  latitude?: number
  longitude?: number
  trails?: string
  highlights?: string[]
  tips?: string
  distance?: string
  duration?: string
  difficulty?: string
  best_season?: string
  pros?: string[]
  cons?: string[]
  founded?: string
  origin?: string
  categories?: string[]
  price_range?: string
  official_site?: string
  buying_tips?: string[]
  specs?: Record<string, string>
}

export default function ItemDetail() {
  const { userInfo } = useUserStore()
  const [item, setItem] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isCircleOwner, setIsCircleOwner] = useState(false)
  const [resourceInfo, setResourceInfo] = useState<any>(null)
  const isAdmin = userInfo?.role === 'admin'

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      loadItem(params.id)
    }
  }, [])

  const loadItem = async (id: string) => {
    try {
      const userId = userInfo?.id || ''
      const res = await Network.request({ url: `/api/resources/item/${id}${userId ? `?user_id=${userId}` : ''}` })
      console.log('Item detail:', res.data)
      const data = res.data?.data || res.data
      setItem(data)
      setLikeCount(data?.like_count || 0)
      setIsLiked(data?.is_liked || false)
      // Check if user is circle owner
      if (userInfo?.id && data?.resource_id) {
        try {
          const resRes = await Network.request({ url: `/api/resources/${data.resource_id}` })
          const resData = resRes.data?.data || resRes.data
          setResourceInfo(resData)
          if (resData?.circle_id) {
            const memberRes = await Network.request({ url: `/api/circles/${resData.circle_id}?user_id=${userInfo.id}` })
            const memberData = memberRes.data?.data || memberRes.data
            if (memberData?.owner_id === userInfo.id || memberData?.is_owner) {
              setIsCircleOwner(true)
            }
          }
        } catch (e) { console.error('Check owner failed:', e) }
      }
    } catch (e) {
      console.error('Load item failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      const res = await Network.request({
        url: `/api/resources/item/${item.id}/like`,
        method: 'POST',
        data: { user_id: userInfo.id }
      })
      const data = res.data?.data || res.data
      if (data?.liked) {
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      } else {
        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      }
    } catch (e) {
      console.error('Like failed:', e)
    }
  }

  const canEdit = isAdmin || isCircleOwner

  if (loading) {
    return <View className="flex items-center justify-center h-full"><Text className="text-gray-400">加载中...</Text></View>
  }

  if (!item) {
    return <View className="flex items-center justify-center h-full"><Text className="text-gray-400">内容不存在</Text></View>
  }

  const content: RichContent = item.rich_content || {}

  return (
    <View className="bg-gray-50 min-h-screen pb-20">
      {/* 头图 */}
      {item.image_url ? (
        <Image src={item.image_url} className="w-full h-56" mode="aspectFill" />
      ) : (
        <View className="w-full h-44 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
          <Text className="text-white text-4xl font-bold">{item.title?.[0] || ''}</Text>
        </View>
      )}

      {/* 标题区 */}
      <View className="bg-white px-4 py-4 -mt-4 rounded-t-2xl relative">
        <View className="flex flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="block text-xl font-bold text-gray-900">{item.title}</Text>
            {item.subtitle && <Text className="block text-sm text-gray-500 mt-1">{item.subtitle}</Text>}
          </View>
          <View className="flex flex-row items-center gap-1 ml-3" onClick={handleLike}>
            <Heart
              size={24}
              color={isLiked ? '#ef4444' : '#9ca3af'}
              filled={isLiked}
            />
            <Text className="text-sm text-gray-600">{likeCount}</Text>
          </View>
        </View>

        {/* 标签和城市 */}
        <View className="flex flex-row flex-wrap gap-2 mt-3">
          {item.city && (
            <View className="flex flex-row items-center bg-blue-50 px-2 py-1 rounded-full">
              <MapPin size={12} color="#3b82f6" />
              <Text className="text-xs text-blue-600 ml-1">{item.city}</Text>
            </View>
          )}
          {(item.tags || []).map((tag: string, i: number) => (
            <View key={i} className="bg-orange-50 px-2 py-1 rounded-full">
              <Text className="text-xs text-orange-600">{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 简介 */}
      {content.intro && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-gray-800 mb-2">简介</Text>
          <Text className="block text-sm text-gray-600 leading-relaxed">{content.intro}</Text>
        </View>
      )}

      {/* 关键信息卡片 */}
      <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
        <Text className="block text-base font-semibold text-gray-800 mb-3">关键信息</Text>
        <View className="gap-3">
          {content.season && (
            <View className="flex flex-row items-center">
              <Calendar size={16} color="#f97316" className="mr-2" />
              <Text className="text-sm text-gray-500 w-16">雪季时间</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.season}</Text>
            </View>
          )}
          {content.best_season && (
            <View className="flex flex-row items-center">
              <Calendar size={16} color="#f97316" className="mr-2" />
              <Text className="text-sm text-gray-500 w-16">最佳季节</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.best_season}</Text>
            </View>
          )}
          {content.price && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">价格</Text>
              <Text className="text-sm text-orange-600 font-medium flex-1">{content.price}</Text>
            </View>
          )}
          {content.price_range && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">价格</Text>
              <Text className="text-sm text-orange-600 font-medium flex-1">{content.price_range}</Text>
            </View>
          )}
          {content.location && (
            <View className="flex flex-row items-center">
              <MapPin size={16} color="#3b82f6" className="mr-2" />
              <Text className="text-sm text-gray-500 w-16">地址</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.location}</Text>
            </View>
          )}
          {content.distance && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">距离</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.distance}</Text>
            </View>
          )}
          {content.duration && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">用时</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.duration}</Text>
            </View>
          )}
          {content.difficulty && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">难度</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.difficulty}</Text>
            </View>
          )}
          {content.trails && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">雪道</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.trails}</Text>
            </View>
          )}
          {content.founded && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">创立</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.founded}</Text>
            </View>
          )}
          {content.origin && (
            <View className="flex flex-row items-center">
              <Text className="text-sm text-gray-500 w-16 ml-6">产地</Text>
              <Text className="text-sm text-gray-800 flex-1">{content.origin}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 亮点/特色 */}
      {content.highlights && content.highlights.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-gray-800 mb-3">亮点特色</Text>
          {content.highlights.map((h, i) => (
            <View key={i} className="flex flex-row items-start mb-2">
              <View className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mr-2 mt-1">
                <Text className="text-xs text-orange-600">{i + 1}</Text>
              </View>
              <Text className="text-sm text-gray-700 flex-1">{h}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 优缺点（骑行路线） */}
      {(content.pros || content.cons) && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <View className="flex flex-row gap-3">
            {content.pros && content.pros.length > 0 && (
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-green-600 mb-2">优点</Text>
                {content.pros.map((p, i) => (
                  <Text key={i} className="block text-xs text-gray-600 mb-1">+ {p}</Text>
                ))}
              </View>
            )}
            {content.cons && content.cons.length > 0 && (
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-red-500 mb-2">不足</Text>
                {content.cons.map((c, i) => (
                  <Text key={i} className="block text-xs text-gray-600 mb-1">- {c}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 购买建议（装备类） */}
      {content.buying_tips && content.buying_tips.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-gray-800 mb-3">选购建议</Text>
          {content.buying_tips.map((t, i) => (
            <View key={i} className="flex flex-row items-start mb-2">
              <ChevronRight size={14} color="#f97316" className="mr-1 mt-1" />
              <Text className="text-sm text-gray-700 flex-1">{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 规格参数 */}
      {content.specs && Object.keys(content.specs).length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-gray-800 mb-3">规格参数</Text>
          {Object.entries(content.specs).map(([key, value]) => (
            <View key={key} className="flex flex-row justify-between py-2 border-b border-gray-50">
              <Text className="text-sm text-gray-500">{key}</Text>
              <Text className="text-sm text-gray-800">{value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 产品分类（品牌类） */}
      {content.categories && content.categories.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-gray-800 mb-3">产品线</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {content.categories.map((c, i) => (
              <View key={i} className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs text-gray-700">{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 贴士 */}
      {content.tips && (
        <View className="bg-amber-50 mx-4 mt-3 p-4 rounded-xl">
          <Text className="block text-base font-semibold text-amber-700 mb-2">实用贴士</Text>
          <Text className="block text-sm text-amber-800 leading-relaxed">{content.tips}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '8px',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100
        }}
      >
        <View className="flex-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => Taro.navigateTo({ url: `/pages/item-submit/index?id=${item.id}&resourceId=${item.resource_id}&type=correction&templateType=${resourceInfo?.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resourceInfo?.title || '')}` })}
          >
            <View className="flex flex-row items-center justify-center">
              <MessageSquare size={14} color="#f97316" />
              <Text className="text-orange-500 ml-1">纠错/补充</Text>
            </View>
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => Taro.navigateTo({ url: `/pages/item-submit/index?resourceId=${item.resource_id}&type=new&templateType=${resourceInfo?.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resourceInfo?.title || '')}` })}
          >
            <View className="flex flex-row items-center justify-center">
              <CirclePlus size={14} color="#3b82f6" />
              <Text className="text-blue-500 ml-1">提交新增</Text>
            </View>
          </Button>
        </View>
        {canEdit && (
          <View className="flex-1">
            <Button
              className="w-full bg-orange-500"
              onClick={() => Taro.navigateTo({ url: `/pages/item-edit/index?id=${item.id}` })}
            >
              <View className="flex flex-row items-center justify-center">
                <Pencil size={14} color="#fff" />
                <Text className="text-white ml-1">编辑</Text>
              </View>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
