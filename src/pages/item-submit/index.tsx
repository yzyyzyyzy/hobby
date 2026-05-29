import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'

// Template field configs: key = template_type + resource title keywords
interface FieldConfig {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
}

const RANKING_FIELDS: Record<string, FieldConfig[]> = {
  ski: [
    { key: 'intro', label: '简介', placeholder: '简要介绍该雪场' },
    { key: 'location', label: '地址', placeholder: '详细地址' },
    { key: 'price', label: '票价', placeholder: '如：平日280元/天，周末380元/天' },
    { key: 'season', label: '雪季时间', placeholder: '如：11月中旬 - 3月底' },
    { key: 'difficulty', label: '难度等级', placeholder: '如：初级到专家级均有雪道' },
    { key: 'features', label: '特色亮点（每行一条）', placeholder: '如：亚洲最大粉雪基地\n国家滑雪队训练基地', multiline: true },
    { key: 'tips', label: '实用贴士（每行一条）', placeholder: '如：建议提前预订住宿\n新手建议请教练', multiline: true },
  ],
  cycling: [
    { key: 'intro', label: '简介', placeholder: '简要介绍该骑行路线' },
    { key: 'distance', label: '总里程', placeholder: '如：约800公里' },
    { key: 'duration', label: '建议用时', placeholder: '如：8-12天' },
    { key: 'location', label: '起点/位置', placeholder: '如：海南省全岛' },
    { key: 'difficulty', label: '难度等级', placeholder: '如：中等偏易' },
    { key: 'best_season', label: '最佳季节', placeholder: '如：10月-次年3月' },
    { key: 'route_highlights', label: '路线亮点（每行一条）', placeholder: '如：东线椰林大道\n三亚亚龙湾', multiline: true },
    { key: 'pros', label: '优点（每行一条）', placeholder: '如：全程柏油路\n补给充足', multiline: true },
    { key: 'cons', label: '缺点（每行一条）', placeholder: '如：夏季太热\n东线车流量大', multiline: true },
    { key: 'tips', label: '骑行贴士（每行一条）', placeholder: '如：建议逆时针骑行\n带防晒和雨具', multiline: true },
  ],
  default: [
    { key: 'intro', label: '简介', placeholder: '简要介绍' },
    { key: 'location', label: '地址', placeholder: '详细地址' },
    { key: 'features', label: '特色亮点（每行一条）', placeholder: '每行一条亮点', multiline: true },
    { key: 'tips', label: '实用贴士（每行一条）', placeholder: '每行一条贴士', multiline: true },
  ],
}

const GALLERY_FIELDS: Record<string, FieldConfig[]> = {
  ski: [
    { key: 'intro', label: '品牌简介', placeholder: '介绍该品牌' },
    { key: 'founded', label: '创立年份', placeholder: '如：1977年' },
    { key: 'headquarters', label: '总部', placeholder: '如：美国佛蒙特州' },
    { key: 'featured_products', label: '代表产品（每行一条）', placeholder: '如：Custom系列单板\nStep On快穿固定器', multiline: true },
    { key: 'pros', label: '优点（每行一条）', placeholder: '如：品类最全\n技术创新领先', multiline: true },
    { key: 'cons', label: '缺点（每行一条）', placeholder: '如：价格偏高\n部分款式需预定', multiline: true },
  ],
  cycling: [
    { key: 'intro', label: '品牌简介', placeholder: '介绍该品牌' },
    { key: 'founded', label: '创立年份', placeholder: '如：1976年' },
    { key: 'headquarters', label: '总部', placeholder: '如：美国威斯康星州' },
    { key: 'featured_products', label: '代表产品（每行一条）', placeholder: '如：Madone公路车\nDomane耐力公路车', multiline: true },
    { key: 'pros', label: '优点（每行一条）', placeholder: '如：产品线全面\n售后服务好', multiline: true },
    { key: 'cons', label: '缺点（每行一条）', placeholder: '如：高端产品价格贵', multiline: true },
  ],
  default: [
    { key: 'intro', label: '简介', placeholder: '简要介绍' },
    { key: 'featured_products', label: '代表产品（每行一条）', placeholder: '每行一个产品', multiline: true },
    { key: 'pros', label: '优点（每行一条）', placeholder: '每行一条', multiline: true },
    { key: 'cons', label: '缺点（每行一条）', placeholder: '每行一条', multiline: true },
  ],
}

const LIST_FIELDS: Record<string, FieldConfig[]> = {
  ski: [
    { key: 'intro', label: '装备简介', placeholder: '简要介绍该装备' },
    { key: 'price_range', label: '价格区间', placeholder: '如：2000-15000元' },
    { key: 'selection_tips', label: '选购建议（每行一条）', placeholder: '如：新手建议租用或买二手\n身高-15cm为单板参考长度', multiline: true },
    { key: 'recommended_brands', label: '推荐品牌（每行一条）', placeholder: '如：Burton(单板)\nSalomon(双板)', multiline: true },
    { key: 'maintenance', label: '保养贴士（每行一条）', placeholder: '如：每次滑完擦干板底\n定期打蜡', multiline: true },
  ],
  cycling: [
    { key: 'intro', label: '装备简介', placeholder: '简要介绍该装备' },
    { key: 'price_range', label: '价格区间', placeholder: '如：200-2500元' },
    { key: 'selection_tips', label: '选购建议（每行一条）', placeholder: '如：选有MIPS认证\n需贴合头部', multiline: true },
    { key: 'recommended_brands', label: '推荐品牌（每行一条）', placeholder: '如：Giro\nPOC\nBell', multiline: true },
  ],
  default: [
    { key: 'intro', label: '简介', placeholder: '简要介绍' },
    { key: 'price_range', label: '价格区间', placeholder: '如：100-1000元' },
    { key: 'selection_tips', label: '选购建议（每行一条）', placeholder: '每行一条建议', multiline: true },
    { key: 'recommended_brands', label: '推荐品牌（每行一条）', placeholder: '每行一个品牌', multiline: true },
  ],
}

function detectCategory(resourceTitle: string, circleCategory: string): string {
  const text = (resourceTitle + ' ' + circleCategory).toLowerCase()
  if (text.includes('雪') || text.includes('ski') || text.includes('滑雪')) return 'ski'
  if (text.includes('骑行') || text.includes('骑') || text.includes('cycling') || text.includes('单车') || text.includes('自行车')) return 'cycling'
  return 'default'
}

function getFieldsForTemplate(templateType: string, category: string): FieldConfig[] {
  switch (templateType) {
    case 'ranking':
      return RANKING_FIELDS[category] || RANKING_FIELDS.default
    case 'gallery':
      return GALLERY_FIELDS[category] || GALLERY_FIELDS.default
    case 'list':
      return LIST_FIELDS[category] || LIST_FIELDS.default
    default:
      return RANKING_FIELDS.default
  }
}

export default function ItemSubmit() {
  const { userInfo } = useUserStore()
  const [itemId, setItemId] = useState('')
  const [submitType, setSubmitType] = useState<'correction' | 'supplement' | 'new'>('correction')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [city, setCity] = useState('')
  const [correctionContent, setCorrectionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [templateType, setTemplateType] = useState('ranking')
  const [category, setCategory] = useState('default')
  const [resourceId, setResourceId] = useState('')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) setItemId(params.id)
    if (params?.resourceId) setResourceId(params.resourceId)
    if (params?.type === 'new') {
      setSubmitType('new')
    } else if (params?.type === 'supplement') {
      setSubmitType('supplement')
    }
    if (params?.templateType) setTemplateType(params.templateType)
    if (params?.categoryHint) {
      const detected = detectCategory(decodeURIComponent(params.categoryHint), '')
      setCategory(detected)
    }

    // Load existing item data for correction/supplement
    if (params?.id && params?.type !== 'new') {
      loadItemData(params.id)
    }
  }, [])

  const loadItemData = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/resources/item/${id}`,
        method: 'GET',
      })
      const item = res.data?.data
      if (item) {
        setTitle(item.title || '')
        setSubtitle(item.subtitle || '')
        setCity(item.city || '')
        if (item.rich_content) {
          const flatFields: Record<string, string> = {}
          for (const [key, val] of Object.entries(item.rich_content)) {
            if (Array.isArray(val)) {
              flatFields[key] = val.join('\n')
            } else {
              flatFields[key] = String(val)
            }
          }
          setFields(flatFields)
        }
      }
    } catch (e) {
      console.error('Load item data failed:', e)
    }
  }

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (submitType === 'new' && !title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (submitType === 'correction' && !correctionContent.trim()) {
      Taro.showToast({ title: '请输入纠错内容', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      // Build rich_content from fields
      const richContent: Record<string, any> = {}
      for (const [key, val] of Object.entries(fields)) {
        if (val.trim()) {
          // Array fields: split by newline
          if (['features', 'tips', 'route_highlights', 'pros', 'cons',
               'featured_products', 'selection_tips', 'recommended_brands', 'maintenance'].includes(key)) {
            richContent[key] = val.split('\n').filter(Boolean)
          } else {
            richContent[key] = val
          }
        }
      }

      const data: Record<string, any> = {
        resource_id: resourceId || undefined,
        submission_type: submitType,
        submitted_by: userInfo.id,
        title: submitType === 'new' ? title : undefined,
        subtitle: submitType === 'new' ? subtitle : undefined,
        city: city || undefined,
        rich_content: Object.keys(richContent).length > 0 ? richContent : undefined,
        correction_content: submitType === 'correction' ? correctionContent : undefined,
      }

      // For correction/supplement, include item_id
      if (submitType !== 'new' && itemId) {
        data.item_id = itemId
      }

      console.log('[ItemSubmit] submitting:', data)
      await Network.request({
        url: '/api/resources/item/submit',
        method: 'POST',
        data,
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

  const activeFields = getFieldsForTemplate(templateType, category)
  const templateLabel = templateType === 'ranking' ? '排行' : templateType === 'gallery' ? '图集' : '列表'

  return (
    <View className="bg-gray-50 min-h-screen">
      <View className="bg-white mx-4 mt-4 rounded-xl p-4">
        {/* Header */}
        <Text className="block text-base font-semibold text-gray-800 mb-1">
          {submitType === 'correction' ? '提交纠错' : submitType === 'supplement' ? '补充内容' : '新增条目'}
        </Text>
        <Text className="block text-xs text-gray-400 mb-4">
          {submitType === 'correction'
            ? '请描述需要修正的内容，审核通过后将更新'
            : submitType === 'supplement'
              ? '补充缺失的信息，审核通过后将更新'
              : `新增${templateLabel}条目，需经审核后展示`}
        </Text>

        {/* Title (for new items) */}
        {submitType === 'new' && (
          <>
            <View className="mb-3">
              <Text className="block text-sm text-gray-600 mb-1">标题 *</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input className="w-full bg-transparent" placeholder="请输入条目标题" value={title} onInput={e => setTitle(e.detail.value)} />
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-gray-600 mb-1">副标题</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input className="w-full bg-transparent" placeholder="一句话描述" value={subtitle} onInput={e => setSubtitle(e.detail.value)} />
              </View>
            </View>
          </>
        )}

        {/* Existing title for correction/supplement */}
        {submitType !== 'new' && title && (
          <View className="mb-3 px-3 py-2 bg-orange-50 rounded-lg">
            <Text className="block text-sm text-orange-700 font-medium">当前条目：{title}</Text>
          </View>
        )}

        {/* City */}
        <View className="mb-3">
          <Text className="block text-sm text-gray-600 mb-1">城市/地区</Text>
          <View className="bg-gray-50 rounded-lg px-3 py-2">
            <Input className="w-full bg-transparent" placeholder="如：吉林、北京" value={city} onInput={e => setCity(e.detail.value)} />
          </View>
        </View>

        {/* Dynamic template fields */}
        {activeFields.map(field => (
          <View key={field.key} className="mb-3">
            <Text className="block text-sm text-gray-600 mb-1">{field.label}</Text>
            {field.multiline ? (
              <View className="bg-gray-50 rounded-lg p-3">
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                  placeholder={field.placeholder}
                  value={fields[field.key] || ''}
                  onInput={e => handleFieldChange(field.key, e.detail.value)}
                />
              </View>
            ) : (
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input className="w-full bg-transparent" placeholder={field.placeholder} value={fields[field.key] || ''} onInput={e => handleFieldChange(field.key, e.detail.value)} />
              </View>
            )}
          </View>
        ))}

        {/* Correction content (for correction type only) */}
        {submitType === 'correction' && (
          <View className="mb-3">
            <Text className="block text-sm text-gray-600 mb-1">纠错内容 *</Text>
            <View className="bg-red-50 rounded-lg p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                placeholder="请描述需要修正的内容，如：价格已更新为XXX"
                value={correctionContent}
                onInput={e => setCorrectionContent(e.detail.value)}
              />
            </View>
          </View>
        )}

        <Button className="w-full bg-orange-500 mt-2" onClick={handleSubmit} disabled={submitting}>
          <Text className="text-white">{submitting ? '提交中...' : '提交审核'}</Text>
        </Button>
      </View>

      {/* Disclaimer */}
      <View className="px-4 py-6">
        <Text className="block text-xs text-gray-400 text-center">
          提交的内容需经主理人/管理员审核后展示
        </Text>
      </View>
    </View>
  )
}
