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
import { Settings, ChevronRight, BookOpen, Users, FileText, ShieldCheck, Headset } from 'lucide-react-taro'

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
      <View className="flex flex-col items-center justify-center h-full bg-neutral-50 px-4">
        <Text className="block text-2xl font-bold text-neutral-900 mb-2">Hobby</Text>
        <Text className="block text-sm text-neutral-500 mb-8">登录后查看个人主页</Text>
        <Button className="bg-orange-500 text-white rounded-xl px-8 mb-4" onClick={handleLogin}>
          <Text className="text-white">微信登录</Text>
        </Button>
        <View className="mt-4" onClick={handleAdminLogin}>
          <Text className="block text-sm text-orange-500 underline">管理员登录</Text>
        </View>
        {/* 未登录状态联系客服 */}
        <View className="mt-6">
          <ContactButton
            label="联系客服"
            sessionFrom="profile_unlogged"
            icon={<Headset size={16} color="#737373" />}
          />
        </View>
      </View>
    )
  }

  // 已登录状态
  return (
    <View className="h-full bg-neutral-50">
      {/* 用户信息头部 */}
      <View className="bg-white px-4 pt-8 pb-4">
        <View className="flex flex-row items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={userInfo?.avatar_url || ''} />
            <AvatarFallback>
              <Text className="text-lg">{(userInfo?.nickname || 'H')[0]}</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="block text-xl font-bold text-neutral-900">{userInfo?.nickname}</Text>
            <Text className="block text-xs text-neutral-500 mt-1">ID: {userInfo?.id?.slice(0, 8)}</Text>
          </View>
          <Settings size={20} color="#737373" onClick={handleEditProfile} />
        </View>

        {/* 兴趣标签 */}
        {tags.length > 0 && (
          <View className="flex flex-row flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-orange-50 text-orange-600">
                {tag}
              </Badge>
            ))}
          </View>
        )}
      </View>

      <Separator />

      {/* 统计数据 */}
      <View className="flex flex-row justify-around bg-white py-4">
        <View className="flex flex-col items-center">
          <Text className="block text-xl font-bold text-neutral-900">{circles.length}</Text>
          <Text className="block text-xs text-neutral-500">加入圈子</Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="block text-xl font-bold text-neutral-900">{posts.length}</Text>
          <Text className="block text-xs text-neutral-500">发布动态</Text>
        </View>
        <View className="flex flex-col items-center">
          <Text className="block text-xl font-bold text-neutral-900">{tags.length}</Text>
          <Text className="block text-xs text-neutral-500">兴趣标签</Text>
        </View>
      </View>

      <View className="h-2" />

      {/* 已加入圈子 */}
      <Card className="mx-4">
        <CardContent className="p-4">
          <View className="flex flex-row items-center justify-between mb-3">
            <View className="flex flex-row items-center gap-2">
              <Users size={16} color="#F97316" />
              <Text className="block text-sm font-semibold text-neutral-900">我的圈子</Text>
            </View>
            <ChevronRight size={16} color="#737373" />
          </View>
          {circles.length > 0 ? (
            <View className="space-y-2">
              {circles.slice(0, 5).map((c) => (
                <View
                  key={c.id}
                  className="flex flex-row items-center justify-between py-2"
                  onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${c.id}` })}
                >
                  <Text className="block text-sm text-neutral-700">{c.name}</Text>
                  <Badge variant="outline" className="text-xs">{c.category}</Badge>
                </View>
              ))}
            </View>
          ) : (
            <Text className="block text-sm text-neutral-400">还没有加入圈子</Text>
          )}
        </CardContent>
      </Card>

      <View className="h-2" />

      {/* 历史动态 */}
      <Card className="mx-4">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <FileText size={16} color="#F97316" />
            <Text className="block text-sm font-semibold text-neutral-900">我的动态</Text>
          </View>
          {posts.length > 0 ? (
            <View className="space-y-2">
              {posts.slice(0, 5).map((p) => (
                <View
                  key={p.id}
                  className="py-2"
                  onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${p.id}` })}
                >
                  <Text className="block text-sm text-neutral-700 line-clamp-2">{p.content}</Text>
                  <Text className="block text-xs text-neutral-400 mt-1">{p.created_at?.slice(0, 10)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="block text-sm text-neutral-400">还没有发布动态</Text>
          )}
        </CardContent>
      </Card>

      <View className="h-2" />

      {/* 功能菜单 */}
      <Card className="mx-4">
        <CardContent className="p-4">
          <View className="space-y-0">
            {isAdmin ? (
              <>
                <View className="flex flex-row items-center justify-between py-3" onClick={() => Taro.navigateTo({ url: '/pages/admin/index' })}>
                  <View className="flex flex-row items-center gap-3">
                    <ShieldCheck size={16} color="#F97316" />
                    <Text className="block text-sm text-orange-600 font-medium">管理后台</Text>
                  </View>
                  <ChevronRight size={16} color="#737373" />
                </View>
                <Separator />
              </>
            ) : (
              <>
                <View className="flex flex-row items-center justify-between py-3" onClick={handleAdminLogin}>
                  <View className="flex flex-row items-center gap-3">
                    <ShieldCheck size={16} color="#737373" />
                    <Text className="block text-sm text-neutral-500">管理员登录</Text>
                  </View>
                  <ChevronRight size={16} color="#737373" />
                </View>
                <Separator />
              </>
            )}
            <View className="flex flex-row items-center justify-between py-3" onClick={handleEditProfile}>
              <View className="flex flex-row items-center gap-3">
                <BookOpen size={16} color="#737373" />
                <Text className="block text-sm text-neutral-700">编辑资料</Text>
              </View>
              <ChevronRight size={16} color="#737373" />
            </View>
            <Separator />
            {/* 联系客服 */}
            <View className="flex flex-row items-center justify-between py-3">
              <View className="flex flex-row items-center gap-3">
                <Headset size={16} color="#737373" />
                <Text className="block text-sm text-neutral-700">联系客服</Text>
              </View>
              <ContactButton
                label="在线咨询"
                sessionFrom="profile"
                showArrow
                className="text-xs text-neutral-400"
              />
            </View>
            <Separator />
            <View className="flex flex-row items-center justify-between py-3" onClick={handleLogout}>
              <Text className="block text-sm text-red-500">退出登录</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 底部安全声明 */}
      <View className="px-4 py-6">
        <Text className="block text-xs text-neutral-400 text-center">
          使用即代表同意《用户协议》《隐私政策》
        </Text>
      </View>
    </View>
  )
}
