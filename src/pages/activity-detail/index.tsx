import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ChevronLeft, Clock, MapPin, Users, Shield, CircleCheck, CircleX, TriangleAlert, DollarSign } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'

export default function ActivityDetail() {
  const activityId = Taro.getCurrentInstance().router?.params?.id || ''
  const { userInfo } = useUserStore()
  const userId = userInfo?.id || Taro.getStorageSync('user_id') || ''

  const [activity, setActivity] = useState<any>(null)
  const [myStatus, setMyStatus] = useState<string>('')
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSafetyModal, setShowSafetyModal] = useState(false)
  const [safetyAgreed, setSafetyAgreed] = useState(false)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadActivity()
  }, [activityId])

  const loadActivity = async () => {
    try {
      const res = await Network.request({
        url: `/api/activities/${activityId}`,
        data: { user_id: userId }
      })
      console.log('Activity detail:', res.data)
      const data = res.data?.data || res.data
      setActivity(data)
      // Load my registration status
      if (userId) {
        try {
          const statusRes = await Network.request({
            url: `/api/activities/${activityId}/my-status`,
            data: { user_id: userId }
          })
          const statusData = statusRes.data?.data || statusRes.data
          setMyStatus(statusData?.status || '')
        } catch { setMyStatus('') }
      }
      // Load participants if user is organizer
      if (data?.user_id === userId) {
        try {
          const pRes = await Network.request({ url: `/api/activities/${activityId}/participants` })
          const pData = pRes.data?.data || pRes.data
          setParticipants(Array.isArray(pData) ? pData : [])
        } catch { setParticipants([]) }
      }
    } catch (err) { console.error('Load activity failed:', err) }
    finally { setLoading(false) }
  }

  const handleRegister = () => {
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    setShowSafetyModal(true)
  }

  const handleConfirmRegister = async () => {
    if (!safetyAgreed) { Taro.showToast({ title: '请先同意安全须知', icon: 'none' }); return }
    if (!emergencyName.trim() || !emergencyPhone.trim()) { Taro.showToast({ title: '请填写紧急联系人', icon: 'none' }); return }
    setSubmitting(true)
    try {
      const res = await Network.request({
        url: '/api/activities/register',
        method: 'POST',
        data: {
          activity_id: activityId,
          user_id: userId,
          emergency_contact_name: emergencyName.trim(),
          emergency_contact_phone: emergencyPhone.trim(),
          safety_agreed: true
        }
      })
      console.log('Register result:', res.data)
      setShowSafetyModal(false)
      setMyStatus(activity?.auto_approve ? 'approved' : 'pending')
      Taro.showToast({ title: activity?.auto_approve ? '报名成功' : '已提交，等待审核', icon: 'success' })
      loadActivity()
    } catch (err) {
      console.error('Register failed:', err)
      Taro.showToast({ title: '报名失败', icon: 'error' })
    } finally { setSubmitting(false) }
  }

  const handleApprove = async (registrationId: string, approved: boolean) => {
    try {
      await Network.request({
        url: `/api/activities/${activityId}/approve`,
        method: 'POST',
        data: { registration_id: registrationId, approved }
      })
      Taro.showToast({ title: approved ? '已通过' : '已拒绝', icon: 'success' })
      loadActivity()
    } catch (err) { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  const handleCancel = async () => {
    const res = await Taro.showModal({ title: '确认取消', content: '取消后将通知所有报名者' })
    if (!res.confirm) return
    try {
      await Network.request({
        url: `/api/activities/${activityId}/cancel`,
        method: 'POST',
        data: { user_id: userId }
      })
      Taro.showToast({ title: '已取消', icon: 'success' })
      loadActivity()
    } catch (err) { Taro.showToast({ title: '取消失败', icon: 'error' }) }
  }

  const handleComplete = async () => {
    const res = await Taro.showModal({ title: '确认完成', content: '标记活动为已完成' })
    if (!res.confirm) return
    try {
      await Network.request({
        url: `/api/activities/${activityId}/complete`,
        method: 'POST',
        data: { user_id: userId }
      })
      Taro.showToast({ title: '已标记完成', icon: 'success' })
      loadActivity()
    } catch (err) { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  const formatTime = (t: string) => {
    if (!t) return ''
    const d = new Date(t)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    recruiting: { label: '招募中', color: '#16A34A', bg: '#DCFCE7' },
    full: { label: '已满员', color: '#D97706', bg: '#FEF3C7' },
    completed: { label: '已完成', color: '#6B7280', bg: '#F3F4F6' },
    cancelled: { label: '已取消', color: '#DC2626', bg: '#FEE2E2' }
  }

  if (loading) {
    return <View className="flex items-center justify-center h-screen bg-stone-50"><Text className="block text-stone-400">加载中...</Text></View>
  }
  if (!activity) {
    return <View className="flex items-center justify-center h-screen bg-stone-50"><Text className="block text-stone-400">活动不存在</Text></View>
  }

  const isOrganizer = activity.user_id === userId
  const statusInfo = statusConfig[activity.status] || statusConfig.recruiting
  const canRegister = activity.status === 'recruiting' && !myStatus

  return (
    <View className="flex flex-col min-h-screen bg-stone-50">
      {/* Header */}
      <View style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FAFAF9' }}>
        <View onClick={() => Taro.navigateBack()} style={{ padding: '4px' }}><ChevronLeft size={22} color="#292524" /></View>
        <Text className="block flex-1 text-lg font-semibold text-stone-800 text-center">活动详情</Text>
        <View style={{ width: '30px' }} />
      </View>

      {/* Status Badge */}
      <View className="mx-3 mt-2">
        <View style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: statusInfo.bg, borderRadius: '12px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
          <View style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusInfo.color }} />
          <Text className="block text-xs font-medium" style={{ color: statusInfo.color }}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Activity Card */}
      <View className="bg-white mx-3 mt-2 rounded-xl p-4 shadow-sm">
        <Text className="block text-stone-900 font-bold text-base mb-3">{activity.title}</Text>

        {/* Info Items */}
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#F97316" />
            <Text className="block text-stone-600 text-sm">{formatTime(activity.activity_time || activity.start_time)}</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="#F97316" />
            <Text className="block text-stone-600 text-sm">{activity.location || '待定'}</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#F97316" />
            <Text className="block text-stone-600 text-sm">{activity.current_participants || activity.current_count || 0}/{activity.max_participants || '不限'} 人</Text>
            {activity.level_requirement && (
              <View style={{ backgroundColor: '#FFF7ED', borderRadius: '8px', paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px' }}>
                <Text className="block text-orange-600 text-xs">{activity.level_requirement}</Text>
              </View>
            )}
          </View>
          {activity.fee_description && (
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="#F97316" />
              <Text className="block text-stone-600 text-sm">{activity.fee_description}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {activity.description && (
          <View style={{ marginTop: '14px', paddingTop: '14px', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#F5F5F4' }}>
            <Text className="block text-stone-800 text-sm leading-6">{activity.description}</Text>
          </View>
        )}

        {/* Auto approve tag */}
        <View style={{ marginTop: '10px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
          {activity.auto_approve ? (
            <><CircleCheck size={14} color="#16A34A" /><Text className="block text-xs text-green-600">自动通过报名</Text></>
          ) : (
            <><Shield size={14} color="#D97706" /><Text className="block text-xs text-amber-600">报名需审核</Text></>
          )}
        </View>
      </View>

      {/* My Registration Status */}
      {myStatus && (
        <View className="bg-white mx-3 mt-2 rounded-xl p-4 shadow-sm">
          <Text className="block text-stone-700 font-medium text-sm mb-2">我的报名状态</Text>
          <View style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: myStatus === 'approved' ? '#DCFCE7' : myStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7', borderRadius: '12px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
            {myStatus === 'approved' && <CircleCheck size={14} color="#16A34A" />}
            {myStatus === 'rejected' && <CircleX size={14} color="#DC2626" />}
            {myStatus === 'pending' && <Clock size={14} color="#D97706" />}
            <Text className="block text-xs font-medium" style={{ color: myStatus === 'approved' ? '#16A34A' : myStatus === 'rejected' ? '#DC2626' : '#D97706' }}>
              {myStatus === 'approved' ? '已通过' : myStatus === 'rejected' ? '已拒绝' : '待审核'}
            </Text>
          </View>
        </View>
      )}

      {/* Organizer: Participants List */}
      {isOrganizer && participants.length > 0 && (
        <View className="bg-white mx-3 mt-2 rounded-xl p-4 shadow-sm">
          <Text className="block text-stone-700 font-medium text-sm mb-3">报名列表 ({participants.length})</Text>
          {participants.map(p => (
            <View key={p.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', paddingBottom: '8px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#F5F5F4' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <View style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="block text-orange-700 text-xs font-bold">{(p.users?.nickname || p.nickname || '用')[0]}</Text>
                </View>
                <View>
                  <Text className="block text-stone-700 text-sm">{p.users?.nickname || p.nickname || '用户'}</Text>
                  {p.emergency_contact_name && <Text className="block text-stone-400 text-xs">紧急联系人: {p.emergency_contact_name} {p.emergency_contact_phone}</Text>}
                </View>
              </View>
              {p.status === 'pending' && (
                <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                  <View onClick={() => handleApprove(p.id, true)} style={{ backgroundColor: '#DCFCE7', borderRadius: '12px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
                    <Text className="block text-green-700 text-xs font-medium">通过</Text>
                  </View>
                  <View onClick={() => handleApprove(p.id, false)} style={{ backgroundColor: '#FEE2E2', borderRadius: '12px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
                    <Text className="block text-red-700 text-xs font-medium">拒绝</Text>
                  </View>
                </View>
              )}
              {p.status === 'approved' && <Text className="block text-green-600 text-xs">已通过</Text>}
              {p.status === 'rejected' && <Text className="block text-red-500 text-xs">已拒绝</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Organizer Actions */}
      {isOrganizer && activity.status === 'recruiting' && (
        <View className="mx-3 mt-2" style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
          <View onClick={handleCancel} style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="block text-red-600 text-sm font-medium">取消活动</Text>
          </View>
          <View onClick={handleComplete} style={{ flex: 1, backgroundColor: '#DCFCE7', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="block text-green-700 text-sm font-medium">标记完成</Text>
          </View>
        </View>
      )}

      {/* Bottom Action */}
      {canRegister && (
        <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFFFFF', padding: '12px 16px', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#F5F5F4' }}>
          <View onClick={handleRegister} style={{ backgroundColor: '#F97316', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="block text-white font-semibold text-sm">立即报名</Text>
          </View>
        </View>
      )}

      {/* Safety Modal */}
      {showSafetyModal && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: '85%', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <TriangleAlert size={20} color="#D97706" />
              <Text className="block text-stone-800 font-bold text-base">安全须知</Text>
            </View>
            <Text className="block text-stone-600 text-sm leading-6 mb-4">
              1. 户外活动存在一定风险，参与者需根据自身身体状况评估是否参加。{'\n'}
              2. 活动期间请遵守组织者安排，不得擅自离队。{'\n'}
              3. 请自备必要的安全装备和防护用品。{'\n'}
              4. 如遇身体不适请立即告知组织者。{'\n'}
              5. 恶劣天气条件下活动可能取消或延期。{'\n'}
              6. 参与者需对自己的安全负责，组织者仅提供协调服务。
            </Text>

            {/* Agree checkbox */}
            <View onClick={() => setSafetyAgreed(!safetyAgreed)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <View style={{ width: '20px', height: '20px', borderRadius: '4px', borderWidth: '2px', borderStyle: 'solid', borderColor: safetyAgreed ? '#F97316' : '#D6D3D1', backgroundColor: safetyAgreed ? '#F97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {safetyAgreed && <CircleCheck size={14} color="#FFFFFF" />}
              </View>
              <Text className="block text-stone-700 text-sm">我已阅读并同意以上安全须知</Text>
            </View>

            {/* Emergency Contact */}
            <Text className="block text-stone-700 font-medium text-sm mb-2">紧急联系人</Text>
            <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginBottom: '14px' }}>
              <View style={{ flex: 1 }}>
                <Input
                  className="bg-stone-100 border-0 h-10"
                  placeholder="联系人姓名"
                  value={emergencyName}
                  onInput={(e: any) => setEmergencyName(e.detail.value)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  className="bg-stone-100 border-0 h-10"
                  placeholder="联系电话"
                  type="number"
                  value={emergencyPhone}
                  onInput={(e: any) => setEmergencyPhone(e.detail.value)}
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              <View onClick={() => setShowSafetyModal(false)} style={{ flex: 1, backgroundColor: '#F5F5F4', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text className="block text-stone-600 text-sm font-medium">取消</Text>
              </View>
              <View
                onClick={submitting ? undefined : handleConfirmRegister}
                style={{ flex: 1, backgroundColor: safetyAgreed ? '#F97316' : '#E7E5E4', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="block text-white text-sm font-medium">确认报名</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: '80px' }} />
    </View>
  )
}
