export default defineAppConfig({
  pages: [
    'pages/square/index',
    'pages/messages/index',
    'pages/publish/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/admin-login/index',
    'pages/admin/index',
    'pages/admin-resource-edit/index',
    'pages/circle-detail/index',
    'pages/post-detail/index',
    'pages/activity-detail/index',
    'pages/edit-profile/index',
    'pages/resource-detail/index',
    'pages/search/index',
    'pages/create-circle/index',
    'pages/publish-post/index',
    'pages/publish-activity/index',
    'pages/submit-resource/index',
    'pages/item-detail/index',
    'pages/item-edit/index',
    'pages/item-submit/index',
    'pages/notifications/index',
    'pages/index/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Hobby',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#737373',
    selectedColor: '#F97316',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/square/index',
        text: '圈子',
        iconPath: './assets/tabbar/compass.png',
        selectedIconPath: './assets/tabbar/compass-active.png'
      },
      {
        pagePath: 'pages/messages/index',
        text: '广场',
        iconPath: './assets/tabbar/newspaper.png',
        selectedIconPath: './assets/tabbar/newspaper-active.png'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布',
        iconPath: './assets/tabbar/plus-circle.png',
        selectedIconPath: './assets/tabbar/plus-circle-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png'
      }
    ]
  }
})
