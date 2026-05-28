import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import {
  Shield, LayoutGrid, BookOpen, TriangleAlert, Ban,
  Trash2, Pencil, Users, ClipboardCheck
} from 'lucide-react-taro'

interface CircleItem {
  id: string; name: string; category: string; description: string;
  tags: string[]; member_count: number; activity_score: number;
}

interface ResourceItem {
  id: string; circle_id: string; title: string; template_type: string;
  description: string; template_data: any; sort_order: number;
}

interface ReportItem {
  id: string; target_type: string; target_id: string; reason: string;
  description: string; status: string; reporter_id: string;
  reporter?: { nickname: string }; created_at: string;
}

interface KeywordItem {
  id: string; keyword: string; category: string;
}

interface ApplicationItem {
  id: string; applicant_id: string; name: string; description: string;
  category: string; tags: string[]; status: string; reject_reason: string;
  applicant?: { nickname: string; avatar_url: string }; created_at: string;
}

interface Stats {
  circle_count: number; user_count: number; post_count: number;
  pending_report_count: number; resource_count: number; pending_application_count: number;
}

const TEMPLATE_TYPES: Record<string, { label: string; icon: string }> = {
  ranking: { label: '排行榜', icon: '🏆' },
  gallery: { label: '图集', icon: '🖼️' },
  list: { label: '列表', icon: '📋' },
}

const CATEGORIES = ['运动', '户外', '文化', '生活']

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [keywords, setKeywords] = useState<KeywordItem[]>([])
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [showCreateCircle, setShowCreateCircle] = useState(false)
  const [showCreateResource, setShowCreateResource] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [rejectingId, setRejectingId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // Create circle form
  const [circleName, setCircleName] = useState('')
  const [circleCategory, setCircleCategory] = useState('运动')
  const [circleDesc, setCircleDesc] = useState('')

  // Create resource form
  const [resTitle, setResTitle] = useState('')
  const [resType, setResType] = useState('ranking')
  const [resDesc, setResDesc] = useState('')

  useEffect(() => {
    loadStats()
    loadCircles()
  }, [])

  useEffect(() => {
    if (activeTab === 'reports') loadReports()
    if (activeTab === 'keywords') loadKeywords()
    if (activeTab === 'applications') loadApplications()
  }, [activeTab])

  useEffect(() => {
    if (selectedCircleId) loadResources(selectedCircleId)
  }, [selectedCircleId])

  const loadStats = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/stats' })
      console.log('Stats response:', res.data)
      if (res.data?.data) setStats(res.data.data)
    } catch (err) { console.error('Load stats failed:', err) }
  }

  const loadCircles = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/circles' })
      console.log('Circles response:', res.data)
      if (res.data?.data) {
        setCircles(res.data.data)
        if (res.data.data.length > 0 && !selectedCircleId) {
          setSelectedCircleId(res.data.data[0].id)
        }
      }
    } catch (err) { console.error('Load circles failed:', err) }
  }

  const loadResources = async (circleId: string) => {
    try {
      const res = await Network.request({ url: `/api/admin/resources?circle_id=${circleId}` })
      console.log('Resources response:', res.data)
      if (res.data?.data) setResources(res.data.data)
    } catch (err) { console.error('Load resources failed:', err) }
  }

  const loadReports = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/reports?status=pending' })
      if (res.data?.data) setReports(res.data.data)
    } catch (err) { console.error('Load reports failed:', err) }
  }

  const loadKeywords = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/keywords' })
      if (res.data?.data) setKeywords(res.data.data)
    } catch (err) { console.error('Load keywords failed:', err) }
  }

  const loadApplications = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/circle-applications' })
      console.log('Applications response:', res.data)
      if (res.data?.data) setApplications(res.data.data)
    } catch (err) { console.error('Load applications failed:', err) }
  }

  const handleCreateCircle = async () => {
    if (!circleName.trim()) return Taro.showToast({ title: '请输入圈子名称', icon: 'none' })
    try {
      const res = await Network.request({
        url: '/api/admin/circles',
        method: 'POST',
        data: { name: circleName, category: circleCategory, description: circleDesc, tags: [] }
      })
      if (res.data?.data) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreateCircle(false)
        setCircleName('')
        setCircleDesc('')
        loadCircles()
        loadStats()
      }
    } catch (err) { console.error('Create circle failed:', err) }
  }

  const handleDeleteCircle = async (id: string) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复' })
    if (!confirm) return
    try {
      await Network.request({ url: `/api/admin/circles/${id}`, method: 'DELETE' })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadCircles()
      loadStats()
    } catch (err) { console.error('Delete circle failed:', err) }
  }

  const handleCreateResource = async () => {
    if (!resTitle.trim() || !selectedCircleId) return Taro.showToast({ title: '请填写完整', icon: 'none' })
    try {
      const res = await Network.request({
        url: '/api/admin/resources',
        method: 'POST',
        data: {
          circle_id: selectedCircleId, title: resTitle,
          template_type: resType, description: resDesc,
          template_data: { items: [] }, sort_order: 0
        }
      })
      if (res.data?.data) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreateResource(false)
        setResTitle(''); setResDesc('')
        loadResources(selectedCircleId)
        loadStats()
      }
    } catch (err) { console.error('Create resource failed:', err) }
  }

  const handleDeleteResource = async (id: string) => {
    try {
      await Network.request({ url: `/api/admin/resources/${id}`, method: 'DELETE' })
      Taro.showToast({ title: '已删除', icon: 'success' })
      if (selectedCircleId) loadResources(selectedCircleId)
    } catch (err) { console.error('Delete resource failed:', err) }
  }

  const handleReport = async (id: string, status: string) => {
    try {
      await Network.request({ url: `/api/admin/reports/${id}`, method: 'PUT', data: { status } })
      Taro.showToast({ title: '已处理', icon: 'success' })
      loadReports()
      loadStats()
    } catch (err) { console.error('Handle report failed:', err) }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return
    try {
      await Network.request({ url: '/api/admin/keywords', method: 'POST', data: { keyword: newKeyword } })
      setNewKeyword('')
      loadKeywords()
    } catch (err) { console.error('Add keyword failed:', err) }
  }

  const handleDeleteKeyword = async (id: string) => {
    try {
      await Network.request({ url: `/api/admin/keywords/${id}`, method: 'DELETE' })
      loadKeywords()
    } catch (err) { console.error('Delete keyword failed:', err) }
  }

  const handleApproveApplication = async (id: string) => {
    try {
      const adminInfo = Taro.getStorageSync('adminInfo')
      const adminId = adminInfo ? JSON.parse(adminInfo).id : ''
      const res = await Network.request({
        url: `/api/admin/applications/${id}/approve`,
        method: 'PUT',
        data: { admin_id: adminId }
      })
      console.log('Approve response:', res.data)
      Taro.showToast({ title: '审批通过', icon: 'success' })
      loadApplications()
      loadCircles()
      loadStats()
    } catch (err) {
      console.error('Approve failed:', err)
      Taro.showToast({ title: '审批失败', icon: 'none' })
    }
  }

  const handleRejectApplication = async (id: string) => {
    if (!rejectReason.trim()) return Taro.showToast({ title: '请填写驳回原因', icon: 'none' })
    try {
      const adminInfo = Taro.getStorageSync('adminInfo')
      const adminId = adminInfo ? JSON.parse(adminInfo).id : ''
      const res = await Network.request({
        url: `/api/admin/applications/${id}/reject`,
        method: 'PUT',
        data: { admin_id: adminId, reject_reason: rejectReason }
      })
      console.log('Reject response:', res.data)
      Taro.showToast({ title: '已驳回', icon: 'success' })
      setRejectingId('')
      setRejectReason('')
      loadApplications()
      loadStats()
    } catch (err) {
      console.error('Reject failed:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const pendingApps = applications.filter(a => a.status === 'pending')
  const processedApps = applications.filter(a => a.status !== 'pending')

  return (
    <View className="min-h-screen bg-neutral-50">
      <View className="bg-white px-4 pt-12 pb-3 border-b border-neutral-100">
        <View className="flex flex-row items-center gap-2">
          <Shield size={20} color="#F97316" />
          <Text className="block text-lg font-bold text-neutral-900">管理后台</Text>
        </View>
      </View>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="px-4">
          <TabsTrigger value="dashboard"><LayoutGrid size={14} color="#666" /> 概览</TabsTrigger>
          <TabsTrigger value="circles"><Users size={14} color="#666" /> 圈子</TabsTrigger>
          <TabsTrigger value="applications"><ClipboardCheck size={14} color="#666" /> 审批{pendingApps.length > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs">{pendingApps.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="resources"><BookOpen size={14} color="#666" /> 资料</TabsTrigger>
          <TabsTrigger value="reports"><TriangleAlert size={14} color="#666" /> 举报</TabsTrigger>
          <TabsTrigger value="keywords"><Ban size={14} color="#666" /> 关键词</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <View className="px-4 py-3">
            <View className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: '圈子', value: stats?.circle_count || 0, icon: '🏂' },
                { label: '用户', value: stats?.user_count || 0, icon: '👥' },
                { label: '帖子', value: stats?.post_count || 0, icon: '📝' },
                { label: '待审批', value: stats?.pending_application_count || 0, icon: '📋' },
                { label: '待举报', value: stats?.pending_report_count || 0, icon: '⚠️' },
                { label: '资料模板', value: stats?.resource_count || 0, icon: '📚' },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-3 text-center">
                    <Text className="block text-xl mb-1">{s.icon}</Text>
                    <Text className="block text-lg font-bold text-neutral-900">{s.value}</Text>
                    <Text className="block text-xs text-neutral-400">{s.label}</Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        </TabsContent>

        {/* Circles Management */}
        <TabsContent value="circles">
          <View className="px-4 py-3">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="block text-sm font-semibold text-neutral-900">圈子列表</Text>
              <Button size="sm" className="bg-orange-500 text-white" onClick={() => setShowCreateCircle(!showCreateCircle)}>
                <Text className="text-white text-xs">创建圈子</Text>
              </Button>
            </View>

            {showCreateCircle && (
              <Card className="mb-3">
                <CardContent className="p-4 space-y-3">
                  <View className="bg-neutral-50 rounded-xl px-4 py-3">
                    <Input placeholder="圈子名称" value={circleName} onInput={(e) => setCircleName(e.detail.value)} />
                  </View>
                  <View className="flex flex-row flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <Badge key={cat} variant={circleCategory === cat ? 'default' : 'outline'}
                        className={circleCategory === cat ? 'bg-orange-500 text-white' : ''}
                        onClick={() => setCircleCategory(cat)}
                      >{cat}</Badge>
                    ))}
                  </View>
                  <View className="bg-neutral-50 rounded-xl px-4 py-3">
                    <Input placeholder="圈子描述" value={circleDesc} onInput={(e) => setCircleDesc(e.detail.value)} />
                  </View>
                  <View className="flex flex-row gap-2">
                    <Button size="sm" className="bg-orange-500 text-white flex-1" onClick={handleCreateCircle}>
                      <Text className="text-white">创建</Text>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowCreateCircle(false)}>
                      <Text>取消</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            )}

            <View className="space-y-2">
              {circles.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Text className="block text-lg">{c.category === '运动' ? '🏂' : c.category === '户外' ? '🏕️' : c.category === '文化' ? '📚' : '🏠'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm font-semibold text-neutral-900">{c.name}</Text>
                        <View className="flex flex-row items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{c.category}</Badge>
                          <Text className="block text-xs text-neutral-400">{c.member_count}人</Text>
                        </View>
                      </View>
                      <View onClick={() => handleDeleteCircle(c.id)}>
                        <Trash2 size={16} color="#EF4444" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        </TabsContent>

        {/* Circle Applications */}
        <TabsContent value="applications">
          <View className="px-4 py-3">
            <Text className="block text-sm font-semibold text-neutral-900 mb-3">圈子审批</Text>

            {pendingApps.length > 0 && (
              <View className="mb-4">
                <Text className="block text-xs text-neutral-500 mb-2">待审批 ({pendingApps.length})</Text>
                <View className="space-y-2">
                  {pendingApps.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <View className="flex flex-row items-center gap-3 mb-2">
                          <View className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Text className="block text-lg">{app.category === '运动' ? '🏂' : app.category === '户外' ? '🏕️' : app.category === '文化' ? '📚' : '🏠'}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="block text-sm font-semibold text-neutral-900">{app.name}</Text>
                            <View className="flex flex-row items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{app.category}</Badge>
                              <Text className="block text-xs text-neutral-400">申请人: {app.applicant?.nickname || '未知'}</Text>
                            </View>
                          </View>
                        </View>
                        {app.description && (
                          <Text className="block text-xs text-neutral-500 mb-2">{app.description}</Text>
                        )}
                        {app.tags && app.tags.length > 0 && (
                          <View className="flex flex-row flex-wrap gap-1 mb-3">
                            {app.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </View>
                        )}

                        {rejectingId === app.id ? (
                          <View className="space-y-2">
                            <View className="bg-neutral-50 rounded-xl px-4 py-3">
                              <Input placeholder="请输入驳回原因" value={rejectReason} onInput={(e) => setRejectReason(e.detail.value)} />
                            </View>
                            <View className="flex flex-row gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRejectingId(''); setRejectReason('') }}>
                                <Text className="text-xs">取消</Text>
                              </Button>
                              <Button size="sm" className="bg-red-500 text-white flex-1" onClick={() => handleRejectApplication(app.id)}>
                                <Text className="text-white text-xs">确认驳回</Text>
                              </Button>
                            </View>
                          </View>
                        ) : (
                          <View className="flex flex-row gap-2">
                            <Button size="sm" className="bg-green-500 text-white flex-1" onClick={() => handleApproveApplication(app.id)}>
                              <Text className="text-white text-xs">通过</Text>
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setRejectingId(app.id)}>
                              <Text className="text-xs">驳回</Text>
                            </Button>
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </View>
              </View>
            )}

            {processedApps.length > 0 && (
              <View>
                <Text className="block text-xs text-neutral-500 mb-2">已处理</Text>
                <View className="space-y-2">
                  {processedApps.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <View className="flex flex-row items-center gap-3">
                          <View className="flex-1">
                            <Text className="block text-sm text-neutral-700">{app.name}</Text>
                            <View className="flex flex-row items-center gap-2 mt-1">
                              <Badge className={app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}>
                                {app.status === 'approved' ? '已通过' : '已驳回'}
                              </Badge>
                              {app.reject_reason && <Text className="block text-xs text-neutral-400">原因: {app.reject_reason}</Text>}
                            </View>
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>
              </View>
            )}

            {applications.length === 0 && (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">📋</Text>
                <Text className="block text-sm text-neutral-400">暂无圈子申请</Text>
              </View>
            )}
          </View>
        </TabsContent>

        {/* Resources Management */}
        <TabsContent value="resources">
          <View className="px-4 py-3">
            <View className="flex flex-row flex-wrap gap-2 mb-3">
              {circles.map((c) => (
                <Badge key={c.id} variant={selectedCircleId === c.id ? 'default' : 'outline'}
                  className={selectedCircleId === c.id ? 'bg-orange-500 text-white' : ''}
                  onClick={() => setSelectedCircleId(c.id)}
                >{c.name}</Badge>
              ))}
            </View>

            {selectedCircleId && (
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="block text-sm font-semibold text-neutral-900">资料模板</Text>
                <Button size="sm" className="bg-orange-500 text-white" onClick={() => setShowCreateResource(!showCreateResource)}>
                  <Text className="text-white text-xs">新建模板</Text>
                </Button>
              </View>
            )}

            {showCreateResource && (
              <Card className="mb-3">
                <CardContent className="p-4 space-y-3">
                  <View className="bg-neutral-50 rounded-xl px-4 py-3">
                    <Input placeholder="模板标题" value={resTitle} onInput={(e) => setResTitle(e.detail.value)} />
                  </View>
                  <View className="flex flex-row flex-wrap gap-2">
                    {Object.entries(TEMPLATE_TYPES).map(([key, val]) => (
                      <Badge key={key} variant={resType === key ? 'default' : 'outline'}
                        className={resType === key ? 'bg-orange-500 text-white' : ''}
                        onClick={() => setResType(key)}
                      >{val.icon} {val.label}</Badge>
                    ))}
                  </View>
                  <View className="bg-neutral-50 rounded-xl px-4 py-3">
                    <Input placeholder="模板描述（可选）" value={resDesc} onInput={(e) => setResDesc(e.detail.value)} />
                  </View>
                  <View className="flex flex-row gap-2">
                    <Button size="sm" className="bg-orange-500 text-white flex-1" onClick={handleCreateResource}>
                      <Text className="text-white">创建</Text>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowCreateResource(false)}>
                      <Text>取消</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            )}

            <View className="space-y-2">
              {resources.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Text className="block text-lg">{TEMPLATE_TYPES[r.template_type]?.icon || '📄'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm font-semibold text-neutral-900">{r.title}</Text>
                        <View className="flex flex-row items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{TEMPLATE_TYPES[r.template_type]?.label}</Badge>
                          <Text className="block text-xs text-neutral-400">排序: {r.sort_order}</Text>
                        </View>
                      </View>
                      <View className="flex flex-row items-center gap-2">
                        <View onClick={() => Taro.navigateTo({ url: `/pages/admin-resource-edit/index?id=${r.id}` })}>
                          <Pencil size={16} color="#F97316" />
                        </View>
                        <View onClick={() => handleDeleteResource(r.id)}>
                          <Trash2 size={16} color="#EF4444" />
                        </View>
                      </View>
                    </View>
                    {r.description && (
                      <Text className="block text-xs text-neutral-400 mt-2">{r.description}</Text>
                    )}
                  </CardContent>
                </Card>
              ))}
              {selectedCircleId && resources.length === 0 && (
                <View className="flex flex-col items-center py-12">
                  <Text className="block text-3xl mb-2">📄</Text>
                  <Text className="block text-sm text-neutral-400">暂无资料模板，点击上方创建</Text>
                </View>
              )}
            </View>
          </View>
        </TabsContent>

        {/* Reports Management */}
        <TabsContent value="reports">
          <View className="px-4 py-3 space-y-2">
            {reports.length > 0 ? reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Badge className={r.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : r.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'}>
                      {r.status === 'pending' ? '待处理' : r.status === 'resolved' ? '已处理' : '已驳回'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{r.target_type}</Badge>
                  </View>
                  <Text className="block text-sm text-neutral-800 mb-1">原因: {r.reason}</Text>
                  {r.description && <Text className="block text-xs text-neutral-500 mb-2">{r.description}</Text>}
                  <View className="flex flex-row items-center justify-between">
                    <Text className="block text-xs text-neutral-400">
                      举报人: {r.reporter?.nickname || '未知'} · {r.created_at?.slice(5, 10)}
                    </Text>
                    {r.status === 'pending' && (
                      <View className="flex flex-row gap-2">
                        <Button size="sm" className="bg-green-500 text-white" onClick={() => handleReport(r.id, 'resolved')}>
                          <Text className="text-white text-xs">通过</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReport(r.id, 'dismissed')}>
                          <Text className="text-xs">驳回</Text>
                        </Button>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )) : (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">✅</Text>
                <Text className="block text-sm text-neutral-400">暂无待处理举报</Text>
              </View>
            )}
          </View>
        </TabsContent>

        {/* Keywords Management */}
        <TabsContent value="keywords">
          <View className="px-4 py-3">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="flex-1 bg-white rounded-xl px-4 py-3 border border-neutral-200">
                <Input placeholder="输入违禁关键词" value={newKeyword} onInput={(e) => setNewKeyword(e.detail.value)} />
              </View>
              <Button size="sm" className="bg-orange-500 text-white" onClick={handleAddKeyword}>
                <Text className="text-white text-xs">添加</Text>
              </Button>
            </View>
            <View className="space-y-2">
              {keywords.map((kw) => (
                <Card key={kw.id}>
                  <CardContent className="p-3">
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center gap-2">
                        <Ban size={14} color="#EF4444" />
                        <Text className="block text-sm text-neutral-800">{kw.keyword}</Text>
                        {kw.category && <Badge variant="outline" className="text-xs">{kw.category}</Badge>}
                      </View>
                      <View onClick={() => handleDeleteKeyword(kw.id)}>
                        <Trash2 size={14} color="#737373" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
              {keywords.length === 0 && (
                <View className="flex flex-col items-center py-12">
                  <Text className="block text-3xl mb-2">🚫</Text>
                  <Text className="block text-sm text-neutral-400">暂无关键词，添加后自动过滤</Text>
                </View>
              )}
            </View>
          </View>
        </TabsContent>
      </Tabs>
    </View>
  )
}
