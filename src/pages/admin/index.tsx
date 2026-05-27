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
  Trash2, Pencil, Users
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
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedCircleId, setSelectedCircleId] = useState('')
  const [showCreateCircle, setShowCreateCircle] = useState(false)
  const [showCreateResource, setShowCreateResource] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

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
    loadKeywords()
  }, [])

  useEffect(() => {
    if (activeTab === 'reports') loadReports()
    if (activeTab === 'keywords') loadKeywords()
  }, [activeTab])

  useEffect(() => {
    if (selectedCircleId) loadResources(selectedCircleId)
  }, [selectedCircleId])

  const loadStats = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/stats' })
      if (res.data?.data) setStats(res.data.data)
    } catch (err) { console.error('Load stats failed:', err) }
  }

  const loadCircles = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/circles' })
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
      if (res.data?.data) setResources(res.data.data)
    } catch (err) { console.error('Load resources failed:', err) }
  }

  const loadReports = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/reports' })
      if (res.data?.data) setReports(res.data.data)
    } catch (err) { console.error('Load reports failed:', err) }
  }

  const loadKeywords = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/keywords' })
      if (res.data?.data) setKeywords(res.data.data)
    } catch (err) { console.error('Load keywords failed:', err) }
  }

  const handleCreateCircle = async () => {
    if (!circleName.trim()) { Taro.showToast({ title: '请输入圈子名称', icon: 'none' }); return }
    try {
      const res = await Network.request({
        url: '/api/admin/circles',
        method: 'POST',
        data: { name: circleName, category: circleCategory, description: circleDesc, tags: [] },
      })
      if (res.data?.data) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreateCircle(false)
        setCircleName(''); setCircleDesc('')
        loadCircles(); loadStats()
      }
    } catch (err) { console.error('Create circle failed:', err) }
  }

  const handleDeleteCircle = async (id: string) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复，确定吗？' })
    if (!confirm) return
    try {
      await Network.request({ url: `/api/admin/circles/${id}`, method: 'DELETE' })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadCircles(); loadStats()
    } catch (err) { console.error('Delete circle failed:', err) }
  }

  const handleCreateResource = async () => {
    if (!resTitle.trim() || !selectedCircleId) { Taro.showToast({ title: '请完善信息', icon: 'none' }); return }
    try {
      const defaultData: Record<string, any> = {
        ranking: { items: [] },
        gallery: { items: [] },
        list: { items: [] },
      }
      const res = await Network.request({
        url: '/api/admin/resources',
        method: 'POST',
        data: {
          circle_id: selectedCircleId,
          title: resTitle,
          template_type: resType,
          description: resDesc,
          template_data: defaultData[resType] || { items: [] },
          sort_order: resources.length,
        },
      })
      if (res.data?.data) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreateResource(false)
        setResTitle(''); setResDesc('')
        loadResources(selectedCircleId); loadStats()
      }
    } catch (err) { console.error('Create resource failed:', err) }
  }

  const handleDeleteResource = async (id: string) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复' })
    if (!confirm) return
    try {
      await Network.request({ url: `/api/admin/resources/${id}`, method: 'DELETE' })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadResources(selectedCircleId); loadStats()
    } catch (err) { console.error('Delete resource failed:', err) }
  }

  const handleReport = async (id: string, status: string) => {
    try {
      await Network.request({
        url: `/api/admin/reports/${id}`,
        method: 'PUT',
        data: { status },
      })
      Taro.showToast({ title: '已处理', icon: 'success' })
      loadReports(); loadStats()
    } catch (err) { console.error('Handle report failed:', err) }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return
    try {
      await Network.request({
        url: '/api/admin/keywords',
        method: 'POST',
        data: { keyword: newKeyword.trim() },
      })
      Taro.showToast({ title: '已添加', icon: 'success' })
      setNewKeyword('')
      loadKeywords()
    } catch (err) { console.error('Add keyword failed:', err) }
  }

  const handleDeleteKeyword = async (id: string) => {
    try {
      await Network.request({ url: `/api/admin/keywords/${id}`, method: 'DELETE' })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadKeywords()
    } catch (err) { console.error('Delete keyword failed:', err) }
  }

  return (
    <View className="min-h-full bg-neutral-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-neutral-100">
        <View className="flex flex-row items-center gap-2">
          <Shield size={20} color="#F97316" />
          <Text className="block text-lg font-bold text-neutral-900">Hobby 管理后台</Text>
        </View>
      </View>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="w-full">
          <TabsTrigger value="dashboard" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <LayoutGrid size={12} color={activeTab === 'dashboard' ? '#F97316' : '#737373'} />
              <Text className="text-xs">概览</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <Users size={12} color={activeTab === 'circles' ? '#F97316' : '#737373'} />
              <Text className="text-xs">圈子</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <BookOpen size={12} color={activeTab === 'resources' ? '#F97316' : '#737373'} />
              <Text className="text-xs">资料库</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <TriangleAlert size={12} color={activeTab === 'reports' ? '#F97316' : '#737373'} />
              <Text className="text-xs">举报</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <Ban size={12} color={activeTab === 'keywords' ? '#F97316' : '#737373'} />
              <Text className="text-xs">词库</Text>
            </View>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <View className="px-4 py-4 space-y-4">
            {stats && (
              <>
                <View className="grid grid-cols-2 gap-3">
                  <Card><CardContent className="p-4 text-center">
                    <Text className="block text-2xl font-bold text-orange-500">{stats.circle_count}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1">圈子</Text>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <Text className="block text-2xl font-bold text-blue-500">{stats.user_count}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1">用户</Text>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <Text className="block text-2xl font-bold text-green-500">{stats.post_count}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1">帖子</Text>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <Text className="block text-2xl font-bold text-red-500">{stats.pending_report_count}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1">待处理举报</Text>
                  </CardContent></Card>
                </View>
                <Card><CardContent className="p-4 text-center">
                  <Text className="block text-2xl font-bold text-purple-500">{stats.resource_count}</Text>
                  <Text className="block text-xs text-neutral-500 mt-1">资料模板</Text>
                </CardContent></Card>
              </>
            )}
            <View className="bg-orange-50 rounded-xl p-4">
              <Text className="block text-sm font-medium text-orange-700 mb-2">管理员登录信息</Text>
              <Text className="block text-xs text-orange-600">账号: admin</Text>
              <Text className="block text-xs text-orange-600">密码: hobby2025</Text>
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
                      <Badge
                        key={cat}
                        variant={circleCategory === cat ? 'default' : 'outline'}
                        className={circleCategory === cat ? 'bg-orange-500 text-white' : ''}
                        onClick={() => setCircleCategory(cat)}
                      >{cat}</Badge>
                    ))}
                  </View>
                  <View className="bg-neutral-50 rounded-xl px-4 py-3">
                    <Input placeholder="圈子描述（可选）" value={circleDesc} onInput={(e) => setCircleDesc(e.detail.value)} />
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

        {/* Resources Management */}
        <TabsContent value="resources">
          <View className="px-4 py-3">
            {/* Circle selector */}
            <View className="flex flex-row flex-wrap gap-2 mb-3">
              {circles.map((c) => (
                <Badge
                  key={c.id}
                  variant={selectedCircleId === c.id ? 'default' : 'outline'}
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
                      <Badge
                        key={key}
                        variant={resType === key ? 'default' : 'outline'}
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
