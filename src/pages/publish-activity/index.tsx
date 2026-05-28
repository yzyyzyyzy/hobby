import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { ChevronDown, TriangleAlert } from 'lucide-react-taro'

export default function PublishActivity() {
  const { userInfo } = useUserStore()
  const [circles, setCircles] = useState<any[]>([])
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [selectedCircleName, setSelectedCircleName] = useState('')
  const [showCirclePicker, setShowCirclePicker] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityTime, setActivityTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [feeDescription, setFeeDescription] = useState('')
  const [autoApprove, setAutoApprove] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState('')
  const [safetyAgreed, setSafetyAgreed] = useState(false)
  const [showSafety, setShowSafety] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMyCircles()
  }, [])

  const loadMyCircles = async () => {
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/users/circles',
        method: 'GET',
        data: { user_id: userId }
      })
      const list = res.data?.data || []
      setCircles(list)
      if (list.length > 0) {
        setSelectedCircleId(list[0].id)
        setSelectedCircleName(list[0].name)
      }
    } catch (e) {
      console.error('[PublishActivity] loadMyCircles error:', e)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCircleId) { Taro.showToast({ title: '请选择圈子', icon: 'none' }); return }
    if (!title.trim()) { Taro.showToast({ title: '请填写标题', icon: 'none' }); return }
    if (!activityTime) { Taro.showToast({ title: '请填写时间', icon: 'none' }); return }
    if (!location.trim()) { Taro.showToast({ title: '请填写地点', icon: 'none' }); return }
    if (!safetyAgreed) { Taro.showToast({ title: '请阅读并同意安全须知', icon: 'none' }); return }

    setSubmitting(true)
    try {
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/activities',
        method: 'POST',
        data: {
          circle_id: selectedCircleId,
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          activity_time: activityTime,
          location: location.trim(),
          max_participants: parseInt(maxParticipants) || 10,
          fee_description: feeDescription.trim(),
          auto_approve: autoApprove,
          safety_agreed: safetyAgreed,
          emergency_contact: emergencyContact.trim()
        }
      })
      if (res.data?.data) {
        Taro.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '发布失败', icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="h-full bg-neutral-50">
      {showCirclePicker && (
        <View className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCirclePicker(false)}>
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-70vh overflow-y-auto">
            <Text className="block text-base font-bold text-neutral-900 mb-4">选择圈子</Text>
            {circles.map(c => (
              <Card key={c.id} className="mb-2" onClick={() => { setSelectedCircleId(c.id); setSelectedCircleName(c.name); setShowCirclePicker(false) }}>
                <CardContent className="p-3 flex flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Text className="block text-sm font-bold text-orange-500">{c.name[0]}</Text>
                  </View>
                  <Text className="block text-sm font-medium text-neutral-900">{c.name}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      )}

      {showSafety && (
        <View className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSafety(false)}>
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-60vh overflow-y-auto">
            <Text className="block text-base font-bold text-neutral-900 mb-3">安全须知</Text>
            <Text className="block text-sm text-neutral-600 leading-6">1. 参加户外活动前，请确保自身身体状况良好，无不适合参加活动的疾病。{'\n'}2. 活动过程中请听从组织者安排，不得擅自离队。{'\n'}3. 请随身携带紧急联系人的联系方式，确保手机电量充足。{'\n'}4. 活动中注意人身和财产安全，如遇紧急情况请及时求助。{'\n'}5. 未成年人参加活动需有监护人陪同。{'\n'}6. 本平台仅提供信息发布服务，不对活动本身的安全性承担责任。</Text>
            <Button className="w-full mt-4" onClick={() => setShowSafety(false)}>
              <Text>我已阅读</Text>
            </Button>
          </View>
        </View>
      )}

      <View className="p-4">
        <Card className="mb-4" onClick={() => setShowCirclePicker(true)}>
          <CardContent className="p-3 flex flex-row items-center justify-between">
            <View>
              <Text className="block text-xs text-neutral-500 mb-1">活动圈子</Text>
              <Text className="block text-sm font-semibold text-neutral-900">{selectedCircleName || '请选择圈子'}</Text>
            </View>
            <ChevronDown size={20} color="#737373" />
          </CardContent>
        </Card>

        <View className="bg-white rounded-xl p-4 mb-4 space-y-4">
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">活动标题</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input placeholder="如：周末南山滑雪" value={title} onInput={(e) => setTitle(e.detail.value)} /></View></View>
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">活动时间</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input placeholder="如：2025-06-01 09:00" value={activityTime} onInput={(e) => setActivityTime(e.detail.value)} /></View></View>
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">活动地点</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input placeholder="如：南山滑雪场" value={location} onInput={(e) => setLocation(e.detail.value)} /></View></View>
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">人数上限</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input type="number" placeholder="10" value={maxParticipants} onInput={(e) => setMaxParticipants(e.detail.value)} /></View></View>
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">费用说明</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input placeholder="如：门票+装备约300元" value={feeDescription} onInput={(e) => setFeeDescription(e.detail.value)} /></View></View>
          <View><Text className="block text-sm font-medium text-neutral-700 mb-1">紧急联系人</Text><View className="bg-neutral-50 rounded-lg px-3 py-2"><Input placeholder="手机号" value={emergencyContact} onInput={(e) => setEmergencyContact(e.detail.value)} /></View></View>
          <View className="flex flex-row items-center justify-between">
            <Text className="block text-sm text-neutral-700">报名自动通过</Text>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="block text-sm font-medium text-neutral-700 mb-1">活动详情</Text>
          <Textarea style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }} placeholder="描述活动内容、要求等..." value={description} onInput={(e) => setDescription(e.detail.value)} />
        </View>

        {/* Safety Agreement */}
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <View className="flex flex-row items-start gap-2" onClick={() => setShowSafety(true)}>
            <TriangleAlert size={18} color="#D97706" />
            <Text className="block text-sm text-amber-700 underline">阅读安全须知</Text>
          </View>
          <View className="flex flex-row items-center gap-2 mt-3" onClick={() => setSafetyAgreed(!safetyAgreed)}>
            <View className={`w-5 h-5 rounded border-2 flex items-center justify-center ${safetyAgreed ? 'bg-orange-500 border-orange-500' : 'border-neutral-300'}`}>
              {safetyAgreed && <Text className="block text-white text-xs">✓</Text>}
            </View>
            <Text className="block text-sm text-neutral-700">我已阅读并同意安全须知</Text>
          </View>
        </View>

        <Button className="w-full" disabled={submitting || !safetyAgreed || !title.trim()} onClick={handleSubmit}>
          <Text>{submitting ? '发布中...' : '发布活动'}</Text>
        </Button>
      </View>
    </View>
  )
}
