import { View, ScrollView, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
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
      const userId = Taro.getStorageSync('user_id')
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
    const userId = Taro.getStorageSync('user_id')
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

  // 排行榜条目渲染
  const renderRankingItems = () => (
    <View>
      {items.map((item, idx) => (
        <Card key={item.id} className="mb-3" onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}>
          <CardContent className="p-4">
            <View className="flex flex-row items-start gap-3">
              <View
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: idx === 0 ? '#FCD34D' : idx === 1 ? '#D1D5DB' : idx === 2 ? '#FB923C' : '#F5F5F5' }}
              >
                <Text className="block text-sm font-bold" style={{ color: idx <= 2 ? '#fff' : '#737373' }}>
                  {idx + 1}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-base font-semibold text-neutral-900">{item.title}</Text>
                  <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                    <Heart size={14} color={item.is_liked ? '#ef4444' : '#9ca3af'} filled={item.is_liked} />
                    <Text className="block text-xs text-neutral-500">{item.like_count}</Text>
                  </View>
                </View>
                {item.subtitle && <Text className="block text-sm text-neutral-500 mt-1">{item.subtitle}</Text>}
                {item.rich_content?.price && <Text className="block text-sm text-orange-500 mt-1">{item.rich_content.price}</Text>}
                <View className="flex flex-row items-center gap-2 mt-2">
                  {item.city && (
                    <View className="flex flex-row items-center">
                      <MapPin size={12} color="#3b82f6" />
                      <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                    </View>
                  )}
                  {item.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} className="bg-orange-50 text-orange-600 text-xs">{tag}</Badge>
                  ))}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  )

  // 图集条目渲染
  const renderGalleryItems = () => (
    <View className="grid grid-cols-2 gap-3">
      {items.map((item, idx) => (
        <Card key={item.id} onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}>
          <CardContent className="p-3">
            <View className="w-full aspect-square bg-neutral-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
              <View className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                <Text className="block text-4xl font-bold text-orange-400">{item.title?.charAt(0) || '?'}</Text>
              </View>
            </View>
            <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
            {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
            <View className="flex flex-row items-center justify-between mt-2">
              {item.city && (
                <View className="flex flex-row items-center">
                  <MapPin size={10} color="#3b82f6" />
                  <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                </View>
              )}
              <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                <Heart size={12} color={item.is_liked ? '#ef4444' : '#9ca3af'} filled={item.is_liked} />
                <Text className="block text-xs text-neutral-500">{item.like_count}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  )

  // 列表条目渲染
  const renderListItems = () => (
    <View>
      {items.map((item, idx) => (
        <Card key={item.id} className="mb-2" onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}>
          <CardContent className="p-4">
            <View className="flex flex-row items-start gap-3">
              <View className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Text className="block text-sm font-semibold text-orange-500">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
                  <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation(); handleItemLike(item.id, idx) }}>
                    <Heart size={12} color={item.is_liked ? '#ef4444' : '#9ca3af'} filled={item.is_liked} />
                    <Text className="block text-xs text-neutral-500">{item.like_count}</Text>
                  </View>
                </View>
                {item.subtitle && <Text className="block text-xs text-neutral-400 mt-1">{item.subtitle}</Text>}
                <View className="flex flex-row items-center gap-2 mt-2">
                  {item.city && (
                    <View className="flex flex-row items-center">
                      <MapPin size={10} color="#3b82f6" />
                      <Text className="block text-xs text-blue-500 ml-1">{item.city}</Text>
                    </View>
                  )}
                  {item.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} className="bg-orange-50 text-orange-600 text-xs">{tag}</Badge>
                  ))}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
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
    <View className="min-h-full bg-neutral-50 pb-16">
      {/* Header */}
      <View className="bg-white px-4 pt-3 pb-4">
        <View className="flex flex-row items-center gap-2 mb-2">
          {resource && templateIcon(resource.template_type)}
          <Text className="block text-lg font-bold text-neutral-900">{resource?.title}</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Badge className="bg-orange-50 text-orange-600">{resource && templateLabel(resource.template_type)}</Badge>
          {resource?.description && (
            <Text className="block text-xs text-neutral-500">{resource.description}</Text>
          )}
        </View>
      </View>

      <Separator />

      {/* 筛选栏 */}
      <View className="bg-white px-4 py-2 flex flex-row items-center justify-between border-b border-neutral-100">
        <View className="flex flex-row items-center gap-2 flex-1 overflow-hidden">
          <SlidersHorizontal size={14} color="#737373" />
          <View className="flex flex-row gap-2 overflow-x-auto">
            <View
              className={`px-3 py-1 rounded-full ${!selectedCity ? 'bg-orange-500' : 'bg-neutral-100'}`}
              onClick={() => handleCityFilter('')}
            >
              <Text className={`block text-xs ${!selectedCity ? 'text-white' : 'text-neutral-600'}`}>全部</Text>
            </View>
            {cities.map(city => (
              <View
                key={city}
                className={`px-3 py-1 rounded-full ${selectedCity === city ? 'bg-orange-500' : 'bg-neutral-100'}`}
                onClick={() => handleCityFilter(city)}
              >
                <Text className={`block text-xs ${selectedCity === city ? 'text-white' : 'text-neutral-600'}`}>{city}</Text>
              </View>
            ))}
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ml-2 ${sortByLikes ? 'bg-orange-500' : 'bg-neutral-100'}`}
          onClick={handleSortToggle}
        >
          <View className="flex flex-row items-center gap-1">
            <Heart size={10} color={sortByLikes ? '#fff' : '#737373'} />
            <Text className={`block text-xs ${sortByLikes ? 'text-white' : 'text-neutral-600'}`}>按热度</Text>
          </View>
        </View>
      </View>

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
          borderTop: '1px solid #f3f4f6', zIndex: 100
        }}
      >
        <Button
          className="w-full bg-orange-500"
          onClick={() => {
            if (resource) Taro.navigateTo({ url: `/pages/item-submit/index?resourceId=${resource.id}&type=new&templateType=${resource.template_type || 'ranking'}&categoryHint=${encodeURIComponent(resource.title || '')}` })
          }}
        >
          <View className="flex flex-row items-center justify-center">
            <CirclePlus size={14} color="#fff" />
            <Text className="text-white ml-1">提交新增条目</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}
