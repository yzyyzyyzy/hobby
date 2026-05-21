export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '帖子详情' })
  : { navigationBarTitleText: '帖子详情' }
