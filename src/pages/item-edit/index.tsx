import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

export default function ItemEdit() {
  const [itemId, setItemId] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [city, setCity] = useState('')
  const [intro, setIntro] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [season, setSeason] = useState('')
  const [highlights, setHighlights] = useState('')
  const [tips, setTips] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      setItemId(params.id)
      loadItem(params.id)
    }
  }, [])

  const loadItem = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/item/${id}` })
      const data = res.data?.data || res.data
      if (data) {
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        setCity(data.city || '')
        const rc = data.rich_content || {}
        setIntro(rc.intro || '')
        setPrice(rc.price || rc.price_range || '')
        setLocation(rc.location || '')
        setSeason(rc.season || rc.best_season || '')
        setHighlights((rc.highlights || []).join('\n'))
        setTips(rc.tips || '')
      }
    } catch (e) {
      console.error('Load item failed:', e)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const richContent: Record<string, any> = {}
      if (intro) richContent.intro = intro
      if (price) richContent.price = price
      if (location) richContent.location = location
      if (season) richContent.season = season
      if (highlights) richContent.highlights = highlights.split('\n').filter(Boolean)
      if (tips) richContent.tips = tips

      // 保留原有 rich_content 中的其他字段
      const origRes = await Network.request({ url: `/api/resources/item/${itemId}` })
      const origData = origRes.data?.data || origRes.data
      const origRc = origData?.rich_content || {}
      Object.keys(origRc).forEach(key => {
        if (!richContent[key]) richContent[key] = origRc[key]
      })

      await Network.request({
        url: `/api/resources/item/${itemId}`,
        method: 'PUT',
        data: { title, subtitle, city, rich_content: richContent }
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e) {
      console.error('Save failed:', e)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="bg-gray-50 min-h-screen p-4">
      <View className="bg-white rounded-xl p-4 gap-4">
        <Text className="block text-base font-semibold text-gray-800 mb-3">编辑条目内容</Text>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">标题</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={title} onInput={e => setTitle(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">副标题</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={subtitle} onInput={e => setSubtitle(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">城市</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={city} onInput={e => setCity(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">简介</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={intro} onInput={e => setIntro(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">价格</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={price} onInput={e => setPrice(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">地址</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={location} onInput={e => setLocation(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">季节/时间</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={season} onInput={e => setSeason(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">亮点特色（每行一条）</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={highlights} onInput={e => setHighlights(e.detail.value)} />
          </View>
        </View>

        <View>
          <Text className="block text-sm text-gray-600 mb-1">实用贴士</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" value={tips} onInput={e => setTips(e.detail.value)} />
          </View>
        </View>

        <Button className="w-full bg-orange-500 mt-4" onClick={handleSave} disabled={saving}>
          <Text className="text-white">{saving ? '保存中...' : '保存'}</Text>
        </Button>
      </View>
    </View>
  )
}
