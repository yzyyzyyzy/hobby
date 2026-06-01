import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
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
  features?: string[]
  route_highlights?: string[]
  tips?: string[]
  distance?: string
  duration?: string
  difficulty?: string
  best_season?: string
  pros?: string[]
  cons?: string[]
  founded?: string
  headquarters?: string
  origin?: string
  categories?: string[]
  featured_products?: string[]
  price_range?: string
  selection_tips?: string[]
  recommended_brands?: string[]
  maintenance?: string[]
  buying_tips?: string[]
  specs?: Record<string, string>
  official_site?: string
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
    return <View className="flex items-center justify-center h-full bg-neutral-50"><Text className="text-neutral-400">加载中...</Text></View>
  }

  if (!item) {
    return <View className="flex items-center justify-center h-full bg-neutral-50"><Text className="text-neutral-400">内容不存在</Text></View>
  }

  const content: RichContent = item.rich_content || {}
  const allHighlights = content.highlights || content.features || content.route_highlights || []
  const allTips = content.tips || content.buying_tips || content.selection_tips || []

  return (
    <View className="bg-neutral-50 min-h-screen pb-24">
      {/* Hero banner */}
      <View className="w-full h-48 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 40%, #C2410C 100%)' }}>
        <Text className="text-white text-6xl font-black" style={{ opacity: 0.15 }}>{item.title?.[0] || ''}</Text>
        <View className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(transparent, #FAFAFA)' }} />
      </View>

      {/* 标题区 - 上移覆盖 */}
      <View className="bg-white mx-4 -mt-6 rounded-2xl p-4 relative" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <View className="flex flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="block text-xl font-bold text-neutral-900">{item.title}</Text>
            {item.subtitle && <Text className="block text-sm text-neutral-400 mt-1">{item.subtitle}</Text>}
          </View>
          <View className="flex flex-col items-center ml-3" onClick={handleLike}>
            <View className="w-10 h-10 rounded-full flex items-center justify-center" style={isLiked ? { background: '#FEF2F2' } : { background: '#F5F5F5' }}>
              <Heart size={20} color={isLiked ? '#ef4444' : '#d4d4d4'} filled={isLiked} />
            </View>
            <Text className="block text-xs font-medium mt-1" style={{ color: isLiked ? '#ef4444' : '#a3a3a3' }}>{likeCount}</Text>
          </View>
        </View>

        {/* 标签和城市 */}
        <View className="flex flex-row flex-wrap gap-2 mt-3">
          {item.city && (
            <View className="flex flex-row items-center px-2 py-1 rounded-full" style={{ background: '#EFF6FF' }}>
              <MapPin size={12} color="#3b82f6" />
              <Text className="text-xs text-blue-500 ml-1 font-medium">{item.city}</Text>
            </View>
          )}
          {(item.tags || []).slice(0, 4).map((tag: string, i: number) => (
            <View key={i} className="px-2 py-1 rounded-full" style={{ background: '#FFF7ED' }}>
              <Text className="text-xs text-orange-500 font-medium">{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 简介 */}
      {content.intro && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-2">简介</Text>
          <Text className="block text-sm text-neutral-500 leading-relaxed">{content.intro}</Text>
        </View>
      )}

      {/* 关键信息卡片 */}
      <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Text className="block text-sm font-bold text-neutral-800 mb-3">关键信息</Text>
        <View className="gap-3">
          {(content.season || content.best_season) && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#FFF7ED' }}>
                <Calendar size={14} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">{content.season ? '雪季时间' : '最佳季节'}</Text>
                <Text className="block text-sm font-medium text-neutral-700">{content.season || content.best_season}</Text>
              </View>
            </View>
          )}
          {(content.price || content.price_range) && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#FFF7ED' }}>
                <Text className="text-xs font-bold" style={{ color: '#F97316' }}>¥</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">价格</Text>
                <Text className="block text-sm font-semibold" style={{ color: '#F97316' }}>{content.price || content.price_range}</Text>
              </View>
            </View>
          )}
          {content.location && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#EFF6FF' }}>
                <MapPin size={14} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">地址</Text>
                <Text className="block text-sm font-medium text-neutral-700">{content.location}</Text>
              </View>
            </View>
          )}
          {content.distance && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#F0FDF4' }}>
                <Text className="text-xs font-bold text-green-600">⏱</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">距离 / 用时</Text>
                <Text className="block text-sm font-medium text-neutral-700">{content.distance} · {content.duration}</Text>
              </View>
            </View>
          )}
          {content.difficulty && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#FEF2F2' }}>
                <Text className="text-xs font-bold text-red-500">!</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">难度</Text>
                <Text className="block text-sm font-medium text-neutral-700">{content.difficulty}</Text>
              </View>
            </View>
          )}
          {content.founded && (
            <View className="flex flex-row items-center">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center mr-3" style={{ background: '#FFF7ED' }}>
                <Calendar size={14} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-neutral-400">创立</Text>
                <Text className="block text-sm font-medium text-neutral-700">{content.founded}{content.headquarters ? ` · ${content.headquarters}` : ''}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 亮点/特色 */}
      {allHighlights.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">亮点特色</Text>
          {allHighlights.map((h, i) => (
            <View key={i} className="flex flex-row items-start mb-3">
              <View className="w-6 h-6 rounded-lg flex items-center justify-center mr-3 mt-1 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
                <Text className="text-xs text-white font-bold">{i + 1}</Text>
              </View>
              <Text className="text-sm text-neutral-600 flex-1 leading-relaxed">{h}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 代表产品（品牌类） */}
      {content.featured_products && content.featured_products.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">代表产品</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {content.featured_products.map((p, i) => (
              <View key={i} className="px-3 py-2 rounded-full" style={{ background: '#FFF7ED' }}>
                <Text className="text-xs font-medium text-orange-600">{p}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 推荐品牌（装备类） */}
      {content.recommended_brands && content.recommended_brands.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">推荐品牌</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {content.recommended_brands.map((b, i) => (
              <View key={i} className="px-3 py-2 rounded-full" style={{ background: '#EFF6FF' }}>
                <Text className="text-xs font-medium text-blue-600">{b}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 优缺点 */}
      {(content.pros || content.cons) && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <View className="flex flex-row gap-3">
            {content.pros && content.pros.length > 0 && (
              <View className="flex-1 bg-green-50 rounded-xl p-3">
                <Text className="block text-xs font-bold text-green-600 mb-2">优点</Text>
                {content.pros.map((p, i) => (
                  <View key={i} className="flex flex-row items-start mb-1">
                    <Text className="block text-green-500 mr-1 text-xs">+</Text>
                    <Text className="block text-xs text-green-700 flex-1">{p}</Text>
                  </View>
                ))}
              </View>
            )}
            {content.cons && content.cons.length > 0 && (
              <View className="flex-1 bg-red-50 rounded-xl p-3">
                <Text className="block text-xs font-bold text-red-500 mb-2">不足</Text>
                {content.cons.map((c, i) => (
                  <View key={i} className="flex flex-row items-start mb-1">
                    <Text className="block text-red-400 mr-1 text-xs">-</Text>
                    <Text className="block text-xs text-red-600 flex-1">{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 选购建议 */}
      {content.selection_tips && content.selection_tips.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">选购建议</Text>
          {content.selection_tips.map((t, i) => (
            <View key={i} className="flex flex-row items-start mb-2">
              <ChevronRight size={14} color="#F97316" className="mr-2 mt-1 flex-shrink-0" />
              <Text className="text-sm text-neutral-600 flex-1">{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 保养建议 */}
      {content.maintenance && content.maintenance.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">保养建议</Text>
          {content.maintenance.map((m, i) => (
            <View key={i} className="flex flex-row items-start mb-2">
              <View className="w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0" style={{ background: '#F0FDF4' }}>
                <Text className="text-xs font-bold text-green-600">{i + 1}</Text>
              </View>
              <Text className="text-sm text-neutral-600 flex-1">{m}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 产品分类 */}
      {content.categories && content.categories.length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">产品线</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {content.categories.map((c, i) => (
              <View key={i} className="px-3 py-2 rounded-full bg-neutral-100">
                <Text className="text-xs font-medium text-neutral-600">{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 规格参数 */}
      {content.specs && Object.keys(content.specs).length > 0 && (
        <View className="bg-white mx-4 mt-3 p-4 rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Text className="block text-sm font-bold text-neutral-800 mb-3">规格参数</Text>
          {Object.entries(content.specs).map(([key, value]) => (
            <View key={key} className="flex flex-row justify-between py-2" style={{ borderBottom: '1px solid #fafafa' }}>
              <Text className="text-sm text-neutral-400">{key}</Text>
              <Text className="text-sm font-medium text-neutral-700">{value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 贴士 */}
      {allTips.length > 0 && (
        <View className="mx-4 mt-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' }}>
          <Text className="block text-sm font-bold text-amber-700 mb-2">实用贴士</Text>
          {allTips.map((t, i) => (
            <View key={i} className="flex flex-row items-start mb-2">
              <Text className="block text-amber-500 mr-2 text-sm">•</Text>
              <Text className="block text-sm text-amber-800 flex-1 leading-relaxed">{typeof t === 'string' ? t : ''}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 操作按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '8px',
          padding: '12px 16px', backgroundColor: '#fff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)', zIndex: 100
        }}
      >
        <View className="flex-1">
          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() => Taro.navigateTo({ url: `/pages/item-submit/index?id=${item.id}&resourceId=${item.resource_id}&type=correction&templateType=${resourceInfo?.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resourceInfo?.title || '')}` })}
          >
            <View className="flex flex-row items-center justify-center">
              <MessageSquare size={14} color="#F97316" />
              <Text className="text-orange-500 ml-1 text-sm">纠错/补充</Text>
            </View>
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() => Taro.navigateTo({ url: `/pages/item-submit/index?resourceId=${item.resource_id}&type=new&templateType=${resourceInfo?.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resourceInfo?.title || '')}` })}
          >
            <View className="flex flex-row items-center justify-center">
              <CirclePlus size={14} color="#3b82f6" />
              <Text className="text-blue-500 ml-1 text-sm">提交新增</Text>
            </View>
          </Button>
        </View>
        {canEdit && (
          <View className="flex-1">
            <Button
              className="w-full rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
              onClick={() => Taro.navigateTo({ url: `/pages/item-edit/index?id=${item.id}` })}
            >
              <View className="flex flex-row items-center justify-center">
                <Pencil size={14} color="#fff" />
                <Text className="text-white ml-1 text-sm">编辑</Text>
              </View>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
