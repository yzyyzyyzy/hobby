import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Clock, MapPin, Users, DollarSign, Shield, TriangleAlert } from 'lucide-react-taro'

interface ActivityDetail {
  id: string
  title: string
  description: string
  activity_time: string
  location: string
  location_lat: string
  location_lng: string
  level_requirement: string
  max_participants: number
  current_participants: number
  fee_description: string
  status: string
  auto_approve: boolean
  safety_agreed: boolean
  emergency_contact: string
  user_nickname: string
  circle_name: string
  registration_status: string | null // null=pending, approved, rejected
}

export default function ActivityDetail() {
  const { isLoggedIn } = useUserStore()
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [safetyChecked, setSafetyChecked] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState('')

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) loadActivity(id)
  }, [])

  const loadActivity = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/activities/${id}`, method: 'GET' })
      console.log('Activity detail:', res.data)
      if (res.data?.data) setActivity(res.data.data)
    } catch (err) {
      console.error('Load activity failed:', err)
    }
  }

  const handleRegister = async () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!safetyChecked) {
      Taro.showToast({ title: '请先阅读安全须知', icon: 'none' })
      return
    }
    if (!activity) return
    try {
      const res = await Network.request({
        url: '/api/activities/register',
        method: 'POST',
        data: {
          activity_id: activity.id,
          emergency_contact: emergencyContact,
        },
      })
      console.log('Register response:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: activity.auto_approve ? '报名成功' : '已提交报名，等待审核', icon: 'success' })
        loadActivity(activity.id)
      }
    } catch (err) {
      console.error('Register failed:', err)
      Taro.showToast({ title: '报名失败', icon: 'none' })
    }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-green-50 text-green-600' },
    full: { label: '已满员', color: 'bg-yellow-50 text-yellow-600' },
    cancelled: { label: '已取消', color: 'bg-red-50 text-red-600' },
    completed: { label: '已完成', color: 'bg-neutral-100 text-neutral-500' },
  }

  if (!activity) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="block text-sm text-neutral-400">加载中...</Text>
      </View>
    )
  }

  const canRegister = activity.status === 'recruiting' && !activity.registration_status

  return (
    <View className="h-full bg-neutral-50 pb-20">
      {/* 活动标题与状态 */}
      <View className="bg-white px-4 py-4">
        <View className="flex flex-row items-start justify-between">
          <Text className="block text-lg font-bold text-neutral-900 flex-1">{activity.title}</Text>
          <Badge className={statusMap[activity.status]?.color || 'bg-neutral-100'}>
            {statusMap[activity.status]?.label || activity.status}
          </Badge>
        </View>
        <Text className="block text-xs text-neutral-400 mt-1">由 {activity.user_nickname} 发起 · {activity.circle_name}</Text>
      </View>

      <View className="h-2" />

      {/* 活动详情 */}
      <Card className="mx-4">
        <CardContent className="p-4 space-y-3">
          <View className="flex flex-row items-center gap-2">
            <Clock size={16} color="#F97316" />
            <Text className="block text-sm text-neutral-700">{activity.activity_time?.slice(0, 16)}</Text>
          </View>
          {activity.location && (
            <View className="flex flex-row items-center gap-2">
              <MapPin size={16} color="#F97316" />
              <Text className="block text-sm text-neutral-700">{activity.location}</Text>
            </View>
          )}
          <View className="flex flex-row items-center gap-2">
            <Users size={16} color="#F97316" />
            <Text className="block text-sm text-neutral-700">
              {activity.current_participants}/{activity.max_participants || '不限'} 人
            </Text>
          </View>
          {activity.fee_description && (
            <View className="flex flex-row items-center gap-2">
              <DollarSign size={16} color="#F97316" />
              <Text className="block text-sm text-neutral-700">{activity.fee_description}</Text>
            </View>
          )}
          {activity.level_requirement && (
            <View className="flex flex-row items-center gap-2">
              <Badge variant="outline" className="text-xs">水平要求: {activity.level_requirement}</Badge>
            </View>
          )}
        </CardContent>
      </Card>

      <View className="h-2" />

      {/* 活动描述 */}
      {activity.description && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-neutral-900 mb-2">活动详情</Text>
            <Text className="block text-sm text-neutral-700 leading-relaxed">{activity.description}</Text>
          </CardContent>
        </Card>
      )}

      <View className="h-2" />

      {/* 安全须知与报名 */}
      {canRegister && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <Shield size={16} color="#22C55E" />
              <Text className="block text-sm font-semibold text-neutral-900">安全须知</Text>
            </View>
            <View className="bg-yellow-50 rounded-lg p-3 mb-3">
              <View className="flex flex-row items-start gap-2">
                <TriangleAlert size={14} color="#EAB308" />
                <Text className="block text-xs text-yellow-700 leading-relaxed">
                  1. 户外活动存在风险，请根据自身身体状况选择参与{'\n'}
                  2. 建议购买相关保险，了解活动风险{'\n'}
                  3. 遵守活动规则，服从组织者安排{'\n'}
                  4. 如遇紧急情况，请联系紧急联系人或拨打110
                </Text>
              </View>
            </View>

            {/* 安全须知勾选 */}
            <View className="flex flex-row items-center gap-2 mb-3" onClick={() => setSafetyChecked(!safetyChecked)}>
              <View className={`w-5 h-5 rounded border-2 flex items-center justify-center ${safetyChecked ? 'bg-orange-500 border-orange-500' : 'border-neutral-300'}`}>
                {safetyChecked && <Text className="block text-white text-xs">✓</Text>}
              </View>
              <Text className="block text-xs text-neutral-700">我已阅读并同意安全须知</Text>
            </View>

            {/* 紧急联系人 */}
            <View className="mb-3">
              <Text className="block text-xs text-neutral-500 mb-1">紧急联系人（选填）</Text>
              <View className="bg-neutral-50 rounded-lg px-3 py-2">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="姓名 + 电话"
                  value={emergencyContact}
                  onInput={(e) => setEmergencyContact(e.detail.value)}
                />
              </View>
            </View>

            <Button
              className="w-full bg-orange-500 text-white rounded-xl py-3"
              onClick={handleRegister}
            >
              <Text className="text-white font-medium">报名参加</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 已报名状态 */}
      {activity.registration_status && (
        <Card className="mx-4">
          <CardContent className="p-4">
            <Badge
              className={
                activity.registration_status === 'approved' ? 'bg-green-50 text-green-600' :
                activity.registration_status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-600'
              }
            >
              {activity.registration_status === 'approved' ? '已通过' :
               activity.registration_status === 'pending' ? '审核中' : '已拒绝'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* 底部免责声明 */}
      <View className="px-4 py-4">
        <Text className="block text-xs text-neutral-400 text-center">
          活动由用户发起，平台不承担安全责任 |《用户协议》《隐私政策》
        </Text>
      </View>
    </View>
  )
}
