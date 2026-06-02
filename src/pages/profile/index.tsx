import { View, Text } from '@tarojs/components'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ContactButton } from '@/components/business/contact-button'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Settings, ChevronRight, BookOpen, Users, FileText, ShieldCheck, Headset, Bell, LogOut, Sparkles } from 'lucide-react-taro'

interface CircleItem {
  id: string
  name: string
  category: string
}

interface PostItem {
  id: string
  content: string
  circle_id: string
  created_at: string
}

export default function Profile() {
  const { userInfo, isLoggedIn, clearUserInfo } = useUserStore()
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [tags, setTags] = useState<string[]>([])
  const isAdminFromStore = userInfo?.role === 'admin'
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      loadUserData()
      setTags(userInfo.interest_tags || [])
      if (isAdminFromStore) {
        setIsAdmin(true)
      } else {
        checkAdmin()
      }
    }
  }, [isLoggedIn, userInfo?.id])

  const checkAdmin = async () => {
    if (!userInfo?.id) return
    try {
      const res = await Network.request({ url: `/api/admin/check`, data: { user_id: userInfo.id } })
      if (res.data?.data?.isAdmin) setIsAdmin(true)
    } catch (err) { console.error('Check admin failed:', err) }
  }

  const loadUserData = async () => {
    if (!userInfo?.id) return
    try {
      const [circlesRes, postsRes] = await Promise.all([
        Network.request({ url: `/api/users/circles?user_id=${userInfo.id}`, method: 'GET' }),
        Network.request({ url: `/api/users/posts?user_id=${userInfo.id}`, method: 'GET' }),
      ])
      console.log('User circles:', circlesRes.data)
      console.log('User posts:', postsRes.data)
      if (circlesRes.data?.data) setCircles(circlesRes.data.data)
      if (postsRes.data?.data) setPosts(postsRes.data.data)
    } catch (err) {
      console.error('Load user data failed:', err)
    }
  }

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleAdminLogin = () => {
    Taro.navigateTo({ url: '/pages/admin-login/index' })
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/edit-profile/index' })
  }

  const handleLogout = () => {
    clearUserInfo()
    setIsAdmin(false)
    Taro.showToast({ title: '已退出登录', icon: 'none' })
  }

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-stone-50 px-6">
        <View className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <Sparkles size={40} color="#FFFFFF" />
        </View>
        <Text className="block text-2xl font-bold text-stone-800 mb-2">Hobby</Text>
        <Text className="block text-sm text-stone-400 mb-10">登录后查看个人主页</Text>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-2xl px-10 py-3 shadow-lg" onClick={handleLogin}>
          <Text className="text-white font-semibold">微信登录</Text>
        </Button>
        <View className="mt-6" onClick={handleAdminLogin}>
          <Text className="block text-sm text-stone-400">管理员登录</Text>
        </View>
        <View className="mt-6">
          <ContactButton
            label="联系客服"
            sessionFrom="profile_unlogged"
            icon={<Headset size={16} color="#A8A29E" />}
          />
        </View>
      </View>
    )
  }

  // 已登录状态
  return (
    <View className="h-full bg-stone-50">
      {/* 用户信息头部 with gradient */}
      <View className="bg-gradient-to-br from-orange-500 to-amber-400 px-5 pt-8 pb-6">
        <View className="flex flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white border-opacity-30 shadow-md">
            <Avatar className="w-16 h-16">
              <AvatarImage src={userInfo?.avatar_url || ''} />
              <AvatarFallback>
                <View className="w-16 h-16 bg-white bg-opacity-20 flex items-center justify-center">
                  <Text className="text-white text-lg font-bold">{(userInfo?.nickname || 'H')[0]}</Text>
                </View>
              </AvatarFallback>
            </Avatar>
          </View>
          <View className="flex-1">
            <Text className="block text-xl font-bold text-white">{userInfo?.nickname}</Text>
            <Text className="block text-xs text-orange-100 mt-1">ID: {userInfo?.id?.slice(0, 8)}</Text>
          </View>
          <View className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center" onClick={handleEditProfile}>
            <Settings size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* 兴趣标签 */}
        {tags.length > 0 && (
          <View className="flex flex-row flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <Badge key={tag} className="bg-white bg-opacity-20 text-white border-0 backdrop-blur-sm">
                {tag}
              </Badge>
            ))}
          </View>
        )}
      </View>

      {/* 统计数据 */}
      <View className="flex flex-row justify-around bg-white py-5 -mt-3 mx-4 rounded-2xl shadow-sm">
        <View className="flex flex-col items-center">
          <Text className="block text-2xl font-bold text-stone-800">{circles.length}</Text>
          <Text className="block text-xs text-stone-400 mt-1">加入圈子</Text>
        </View>
        <View className="w-px bg-stone-100" />
        <View className="flex flex-col items-center">
          <Text className="block text-2xl font-bold text-stone-800">{posts.length}</Text>
          <Text className="block text-xs text-stone-400 mt-1">发布动态</Text>
        </View>
        <View className="w-px bg-stone-100" />
        <View className="flex flex-col items-center">
          <Text className="block text-2xl font-bold text-stone-800">{tags.length}</Text>
          <Text className="block text-xs text-stone-400 mt-1">兴趣标签</Text>
        </View>
      </View>

      <View className="h-3" />

      {/* 已加入圈子 */}
      <Card className="mx-4 border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <View className="flex flex-row items-center justify-between mb-3">
            <View className="flex flex-row items-center gap-2">
              <View className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                <Users size={14} color="#F97316" />
              </View>
              <Text className="block text-sm font-semibold text-stone-700">我的圈子</Text>
            </View>
            <ChevronRight size={16} color="#A8A29E" />
          </View>
          {circles.length > 0 ? (
            <View>
              {circles.slice(0, 5).map((c) => (
                <View
                  key={c.id}
                  className="flex flex-row items-center justify-between py-3 border-b border-stone-50 last:border-0"
                  onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${c.id}` })}
                >
                  <View className="flex flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                      <Text className="block text-orange-500 text-xs font-bold">{c.name[0]}</Text>
                    </View>
                    <Text className="block text-sm text-stone-600">{c.name}</Text>
                  </View>
                  <Badge className="bg-stone-100 text-stone-500 border-0 text-xs">{c.category}</Badge>
                </View>
              ))}
            </View>
          ) : (
            <Text className="block text-sm text-stone-400 py-2">还没有加入圈子</Text>
          )}
        </CardContent>
      </Card>

      <View className="h-3" />

      {/* 历史动态 */}
      <Card className="mx-4 border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <View className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText size={14} color="#F97316" />
            </View>
            <Text className="block text-sm font-semibold text-stone-700">我的动态</Text>
          </View>
          {posts.length > 0 ? (
            <View>
              {posts.slice(0, 5).map((p) => (
                <View
                  key={p.id}
                  className="py-3 border-b border-stone-50 last:border-0"
                  onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${p.id}` })}
                >
                  <Text className="block text-sm text-stone-600 ">{p.content}</Text>
                  <Text className="block text-xs text-stone-400 mt-1">{p.created_at?.slice(0, 10)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="block text-sm text-stone-400 py-2">还没有发布动态</Text>
          )}
        </CardContent>
      </Card>

      <View className="h-3" />

      {/* 功能菜单 */}
      <Card className="mx-4 border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <View>
            {isAdmin ? (
              <>
                <View className="flex flex-row items-center justify-between py-3" onClick={() => Taro.navigateTo({ url: '/pages/admin/index' })}>
                  <View className="flex flex-row items-center gap-3">
                    <View className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={14} color="#F97316" />
                    </View>
                    <Text className="block text-sm text-orange-600 font-medium">管理后台</Text>
                  </View>
                  <ChevronRight size={16} color="#A8A29E" />
                </View>
                <Separator className="my-1" />
              </>
            ) : (
              <>
                <View className="flex flex-row items-center justify-between py-3" onClick={handleAdminLogin}>
                  <View className="flex flex-row items-center gap-3">
                    <View className="w-7 h-7 bg-stone-50 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={14} color="#A8A29E" />
                    </View>
                    <Text className="block text-sm text-stone-500">管理员登录</Text>
                  </View>
                  <ChevronRight size={16} color="#A8A29E" />
                </View>
                <Separator className="my-1" />
              </>
            )}
            <View className="flex flex-row items-center justify-between py-3" onClick={handleEditProfile}>
              <View className="flex flex-row items-center gap-3">
                <View className="w-7 h-7 bg-stone-50 rounded-lg flex items-center justify-center">
                  <BookOpen size={14} color="#78716C" />
                </View>
                <Text className="block text-sm text-stone-600">编辑资料</Text>
              </View>
              <ChevronRight size={16} color="#A8A29E" />
            </View>
            <Separator className="my-1" />
            <View className="flex flex-row items-center justify-between py-3" onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}>
              <View className="flex flex-row items-center gap-3">
                <View className="w-7 h-7 bg-stone-50 rounded-lg flex items-center justify-center">
                  <Bell size={14} color="#78716C" />
                </View>
                <Text className="block text-sm text-stone-600">消息通知</Text>
              </View>
              <ChevronRight size={16} color="#A8A29E" />
            </View>
            <Separator className="my-1" />
            <View className="flex flex-row items-center justify-between py-3">
              <View className="flex flex-row items-center gap-3">
                <View className="w-7 h-7 bg-stone-50 rounded-lg flex items-center justify-center">
                  <Headset size={14} color="#78716C" />
                </View>
                <Text className="block text-sm text-stone-600">联系客服</Text>
              </View>
              <ContactButton
                label="在线咨询"
                sessionFrom="profile"
                showArrow
                className="text-xs text-stone-400"
              />
            </View>
            <Separator className="my-1" />
            <View className="flex flex-row items-center justify-between py-3" onClick={handleLogout}>
              <View className="flex flex-row items-center gap-3">
                <View className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <LogOut size={14} color="#EF4444" />
                </View>
                <Text className="block text-sm text-red-500">退出登录</Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 底部安全声明 */}
      <View className="px-4 py-6">
        <Text className="block text-xs text-stone-400 text-center">
          使用即代表同意《用户协议》《隐私政策》
        </Text>
      </View>
    </View>
  )
}
