export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '活动详情' })
  : { navigationBarTitleText: '活动详情' }
