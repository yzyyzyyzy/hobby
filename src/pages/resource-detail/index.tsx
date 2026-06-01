import { View, ScrollView, Text } from '@tarojs/components'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Trophy, Image, ListChecks, MapPin, Heart, SlidersHorizontal, CirclePlus } from 'lucide-react-taro'

interface Resource {
  id: string; title: string; template_type: string; description: string;
  template_data: any; sort_order: number; circle_id: string;
}

interface ResourceItem {
  id: string; title: string; subtitle: string; image_url: string;
  rich_content: any; city: string; tags: string[]; like_count: number;
  is_liked: boolean; sort_order: number;
}

export default function ResourceDetail() {
  const userStoreInfo = useUserStore((s) => s.userInfo)
  const [resource, setResource] = useState<Resource | null>(null)
  const [items, setItems] = useState<ResourceItem[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [sortByLikes, setSortByLikes] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) {
      loadResource(id)
      loadCities(id)
      loadItems(id)
    }
  }, [])

  const loadResource = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/${id}` })
      console.log('Resource detail:', res.data)
      if (res.data?.data) setResource(res.data.data)
    } catch (err) { console.error('Load resource failed:', err) }
  }

  const loadCities = async (resourceId: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/${resourceId}/cities` })
      const data = res.data?.data || res.data
      if (Array.isArray(data)) setCities(data)
    } catch (err) { console.error('Load cities failed:', err) }
  }

  const loadItems = async (resourceId: string, city?: string, sortBy?: string) => {
    setLoading(true)
    try {
      let url = `/api/resources/${resourceId}/items?`
      if (city) url += `city=${city}&`
      if (sortBy) url += `sort_by=${sortBy}&`
      const userId = Taro.getStorageSync('user_id') || userStoreInfo?.id
      if (userId) url += `user_id=${userId}&`
      const res = await Network.request({ url })
      console.log('Resource items:', res.data)
      const data = res.data?.data || res.data
      if (Array.isArray(data)) setItems(data)
    } catch (err) { console.error('Load items failed:', err) }
    finally { setLoading(false) }
  }

  const handleCityFilter = (city: string) => {
    const newCity = selectedCity === city ? '' : city
    setSelectedCity(newCity)
    if (resource) loadItems(resource.id, newCity || undefined, sortByLikes ? 'likes' : undefined)
  }

  const handleSortToggle = () => {
    const newSort = !sortByLikes
    setSortByLikes(newSort)
    if (resource) loadItems(resource.id, selectedCity || undefined, newSort ? 'likes' : undefined)
  }

  const handleItemLike = async (itemId: string, idx: number) => {
    const userId = Taro.getStorageSync('user_id') || userStoreInfo?.id
    if (!userId) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      const res = await Network.request({
        url: `/api/resources/item/${itemId}/like`,
        method: 'POST',
        data: { user_id: userId }
      })
      const data = res.data?.data || res.data
      const newItems = [...items]
      if (data?.liked) {
        newItems[idx] = { ...newItems[idx], is_liked: true, like_count: newItems[idx].like_count + 1 }
      } else {
        newItems[idx] = { ...newItems[idx], is_liked: false, like_count: Math.max(0, newItems[idx].like_count - 1) }
      }
      setItems(newItems)
    } catch (err) { console.error('Like failed:', err) }
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

  const rankBg = (idx: number) => {
    if (idx === 0) return 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)'
    if (idx === 1) return 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)'
    if (idx === 2) return 'linear-gradient(135deg, #FDBA74 0%, #EA580C 100%)'
    return 'linear-gradient(135deg, #F5F5F5 0%, #E5E5E5 100%)'
  }

  // 排行榜条目渲染
  const renderRankingItems = () => (
    <View>
      {items.map((item, idx) => (
        <View
          key={item.id}
          className="mb-3 bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
        >
          <View className="p-4">
            <View className="flex flex-row items-start gap-3">
              <View
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: rankBg(idx) }}
              >
                <Text className="block text-sm font-extrabold" style={{ color: idx <= 2 ? '#fff' : '#737373' }}>
                  {idx + 1}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-base font-bold text-neutral-900">{item.title}</Text>
                  <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                    <Heart size={16} color={item.is_liked ? '#ef4444' : '#d4d4d4'} filled={item.is_liked} />
                    <Text className="block text-xs font-medium" style={{ color: item.is_liked ? '#ef4444' : '#a3a3a3' }}>{item.like_count}</Text>
                  </View>
                </View>
                {item.subtitle && <Text className="block text-sm text-neutral-400 mt-1">{item.subtitle}</Text>}
                {item.rich_content?.price && (
                  <Text className="block text-sm font-semibold mt-1" style={{ color: '#F97316' }}>{item.rich_content.price}</Text>
                )}
                <View className="flex flex-row items-center gap-2 mt-2">
                  {item.city && (
                    <View className="flex flex-row items-center bg-blue-50 rounded-full px-2 py-1">
                      <MapPin size={10} color="#3b82f6" />
                      <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                    </View>
                  )}
                  {item.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} className="bg-orange-50 text-orange-500 text-xs border-0 rounded-full">{tag}</Badge>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )

  // 图集条目渲染
  const renderGalleryItems = () => (
    <View className="grid grid-cols-2 gap-3">
      {items.map((item, idx) => (
        <View
          key={item.id}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
        >
          <View className="w-full aspect-square overflow-hidden">
            <View className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' }}>
              <Text className="block text-5xl font-black" style={{ color: '#FB923C', opacity: 0.4 }}>{item.title?.charAt(0) || '?'}</Text>
            </View>
          </View>
          <View className="p-3">
            <Text className="block text-sm font-bold text-neutral-800">{item.title}</Text>
            {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
            <View className="flex flex-row items-center justify-between mt-2">
              {item.city && (
                <View className="flex flex-row items-center bg-blue-50 rounded-full px-2 py-1">
                  <MapPin size={10} color="#3b82f6" />
                  <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                </View>
              )}
              <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                <Heart size={12} color={item.is_liked ? '#ef4444' : '#d4d4d4'} filled={item.is_liked} />
                <Text className="block text-xs text-neutral-500">{item.like_count}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )

  // 列表条目渲染
  const renderListItems = () => (
    <View>
      {items.map((item, idx) => (
        <View
          key={item.id}
          className="mb-2 bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
        >
          <View className="p-4">
            <View className="flex flex-row items-start gap-3">
              <View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' }}>
                <Text className="block text-sm font-bold" style={{ color: '#F97316' }}>{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-sm font-semibold text-neutral-800">{item.title}</Text>
                  <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                    <Heart size={14} color={item.is_liked ? '#ef4444' : '#d4d4d4'} filled={item.is_liked} />
                    <Text className="block text-xs text-neutral-500">{item.like_count}</Text>
                  </View>
                </View>
                {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
                <View className="flex flex-row items-center gap-2 mt-2">
                  {item.city && (
                    <View className="flex flex-row items-center bg-blue-50 rounded-full px-2 py-1">
                      <MapPin size={10} color="#3b82f6" />
                      <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                    </View>
                  )}
                  {item.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} className="bg-orange-50 text-orange-500 text-xs border-0 rounded-full">{tag}</Badge>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )

  if (!resource && loading) {
    return (
      <View className="flex items-center justify-center h-screen bg-neutral-50">
        <Text className="block text-neutral-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-neutral-50 pb-20">
      {/* Header with gradient */}
      <View className="px-4 pt-4 pb-5" style={{ background: 'linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%)' }}>
        <View className="flex flex-row items-center gap-2 mb-2">
          {resource && templateIcon(resource.template_type)}
          <Text className="block text-lg font-bold text-neutral-900">{resource?.title}</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Badge className="text-orange-600 text-xs border-0 rounded-full" style={{ background: '#FFF7ED' }}>{resource && templateLabel(resource.template_type)}</Badge>
          {resource?.description && (
            <Text className="block text-xs text-neutral-400">{resource.description}</Text>
          )}
        </View>
      </View>

      {/* 筛选栏 */}
      {cities.length > 0 && (
        <View className="bg-white px-4 py-3 flex flex-row items-center justify-between" style={{ borderBottom: '1px solid #fafafa' }}>
          <View className="flex flex-row items-center gap-2 flex-1 overflow-hidden">
            <SlidersHorizontal size={14} color="#a3a3a3" />
            <View className="flex flex-row gap-2 overflow-x-auto">
              <View
                className={`px-3 py-1 rounded-full ${!selectedCity ? '' : 'bg-neutral-100'}`}
                style={!selectedCity ? { background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' } : {}}
                onClick={() => handleCityFilter('')}
              >
                <Text className={`block text-xs font-medium ${!selectedCity ? 'text-white' : 'text-neutral-500'}`}>全部</Text>
              </View>
              {cities.map(city => (
                <View
                  key={city}
                  className={`px-3 py-1 rounded-full ${selectedCity === city ? '' : 'bg-neutral-100'}`}
                  style={selectedCity === city ? { background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' } : {}}
                  onClick={() => handleCityFilter(city)}
                >
                  <Text className={`block text-xs font-medium ${selectedCity === city ? 'text-white' : 'text-neutral-500'}`}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full ml-2 ${sortByLikes ? '' : 'bg-neutral-100'}`}
            style={sortByLikes ? { background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' } : {}}
            onClick={handleSortToggle}
          >
            <View className="flex flex-row items-center gap-1">
              <Heart size={10} color={sortByLikes ? '#fff' : '#a3a3a3'} />
              <Text className={`block text-xs font-medium ${sortByLikes ? 'text-white' : 'text-neutral-500'}`}>按热度</Text>
            </View>
          </View>
        </View>
      )}

      {/* 条目内容 */}
      <ScrollView scrollY className="px-4 py-3">
        {loading ? (
          <View className="flex items-center py-16"><Text className="text-neutral-400">加载中...</Text></View>
        ) : items.length === 0 ? (
          <View className="flex flex-col items-center py-16">
            <Text className="block text-3xl mb-2">📋</Text>
            <Text className="block text-sm text-neutral-400">暂无条目数据</Text>
          </View>
        ) : (
          <>
            {resource?.template_type === 'ranking' && renderRankingItems()}
            {resource?.template_type === 'gallery' && renderGalleryItems()}
            {resource?.template_type === 'list' && renderListItems()}
          </>
        )}
      </ScrollView>

      {/* 提交新增按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px', backgroundColor: '#fff',
          boxShadow: '0 -1px 4px rgba(0,0,0,0.05)', zIndex: 100
        }}
      >
        <Button
          className="w-full rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
          onClick={() => {
            if (resource) Taro.navigateTo({ url: `/pages/item-submit/index?resourceId=${resource.id}&type=new&templateType=${resource.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resource.title || '')}` })
          }}
        >
          <View className="flex flex-row items-center justify-center">
            <CirclePlus size={14} color="#fff" />
            <Text className="text-white ml-1 font-medium">提交新增条目</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}
