import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react-taro'

interface ResourceData {
  id: string; title: string; template_type: string; description: string;
  template_data: any; sort_order: number;
}

const TEMPLATE_TYPES: Record<string, { label: string; icon: string; fields: string[] }> = {
  ranking: {
    label: '排行榜', icon: '🏆',
    fields: ['rank', 'title', 'subtitle', 'score', 'detail'],
  },
  gallery: {
    label: '图集', icon: '🖼️',
    fields: ['title', 'subtitle', 'image_url', 'link'],
  },
  list: {
    label: '列表', icon: '📋',
    fields: ['title', 'subtitle', 'icon_url', 'tags'],
  },
}

const FIELD_LABELS: Record<string, string> = {
  rank: '排名', title: '标题', subtitle: '副标题', score: '评分',
  detail: '详情', image_url: '图片URL', link: '链接', icon_url: '图标URL', tags: '标签',
}

export default function AdminResourceEdit() {
  const [resource, setResource] = useState<ResourceData | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [resType, setResType] = useState('ranking')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) loadResource(id)
  }, [])

  const loadResource = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resources/${id}` })
      console.log('Resource detail:', res.data)
      if (res.data?.data) {
        const data = res.data.data
        setResource(data)
        setTitle(data.title)
        setDescription(data.description || '')
        setResType(data.template_type)
        setItems(data.template_data?.items || [])
      }
    } catch (err) { console.error('Load resource failed:', err) }
  }

  const handleAddItem = () => {
    const newItem: Record<string, any> = {}
    const fields = TEMPLATE_TYPES[resType]?.fields || []
    fields.forEach((f) => {
      if (f === 'rank') newItem[f] = items.length + 1
      else if (f === 'score') newItem[f] = 0
      else if (f === 'tags') newItem[f] = []
      else newItem[f] = ''
    })
    setItems([...items, newItem])
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!resource) return
    setSaving(true)
    try {
      const res = await Network.request({
        url: `/api/admin/resources/${resource.id}`,
        method: 'PUT',
        data: {
          title,
          description,
          template_data: { items },
        },
      })
      console.log('Save resource response:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
      }
    } catch (err) {
      console.error('Save resource failed:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const fields = TEMPLATE_TYPES[resType]?.fields || []

  return (
    <View className="min-h-full bg-neutral-50 pb-20">
      <View className="px-4 py-3 space-y-3">
        {/* Basic Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Text className="block text-sm font-semibold text-neutral-900">基本信息</Text>
            <View className="bg-neutral-50 rounded-xl px-4 py-3">
              <Input placeholder="模板标题" value={title} onInput={(e) => setTitle(e.detail.value)} />
            </View>
            <View className="flex flex-row items-center gap-2">
              <Text className="block text-xs text-neutral-500">模板类型:</Text>
              <Badge className="bg-orange-50 text-orange-600">
                {TEMPLATE_TYPES[resType]?.icon} {TEMPLATE_TYPES[resType]?.label}
              </Badge>
            </View>
            <View className="bg-neutral-50 rounded-xl px-4 py-3">
              <Input placeholder="模板描述" value={description} onInput={(e) => setDescription(e.detail.value)} />
            </View>
          </CardContent>
        </Card>

        {/* Items */}
        <View className="flex flex-row items-center justify-between">
          <Text className="block text-sm font-semibold text-neutral-900">
            内容条目 ({items.length})
          </Text>
          <Button size="sm" className="bg-orange-500 text-white" onClick={handleAddItem}>
            <Text className="text-white text-xs">添加条目</Text>
          </Button>
        </View>

        {items.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 space-y-2">
              <View className="flex flex-row items-center justify-between mb-1">
                <Text className="block text-xs font-medium text-neutral-500">#{idx + 1}</Text>
                <View onClick={() => handleRemoveItem(idx)}>
                  <Trash2 size={14} color="#EF4444" />
                </View>
              </View>
              {fields.map((field) => (
                <View key={field} className="bg-neutral-50 rounded-lg px-3 py-2">
                  <Text className="block text-xs text-neutral-400 mb-1">{FIELD_LABELS[field] || field}</Text>
                  {field === 'tags' ? (
                    <Input
                      placeholder="逗号分隔，如: 必备,推荐"
                      value={Array.isArray(item[field]) ? item[field].join(',') : item[field] || ''}
                      onInput={(e) => handleUpdateItem(idx, field, e.detail.value.split(',').filter(Boolean))}
                    />
                  ) : field === 'detail' ? (
                    <Input
                      placeholder={`输入${FIELD_LABELS[field] || field}`}
                      value={item[field] || ''}
                      onInput={(e) => handleUpdateItem(idx, field, e.detail.value)}
                    />
                  ) : (
                    <Input
                      placeholder={`输入${FIELD_LABELS[field] || field}`}
                      value={String(item[field] ?? '')}
                      onInput={(e) => handleUpdateItem(idx, field, field === 'rank' || field === 'score' ? Number(e.detail.value) : e.detail.value)}
                    />
                  )}
                </View>
              ))}
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <View className="flex flex-col items-center py-12">
            <Text className="block text-3xl mb-2">{TEMPLATE_TYPES[resType]?.icon}</Text>
            <Text className="block text-sm text-neutral-400">暂无条目，点击&ldquo;添加条目&rdquo;开始编辑</Text>
          </View>
        )}
      </View>

      {/* Save Button */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'row',
          padding: '12px', backgroundColor: '#fff',
          borderTop: '1px solid #e5e5e5', zIndex: 100,
        }}
      >
        <Button className="w-full bg-orange-500 text-white py-3" onClick={handleSave} disabled={saving}>
          <Text className="text-white font-medium">{saving ? '保存中...' : '保存'}</Text>
        </Button>
      </View>
    </View>
  )
}
