export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发起活动' })
  : { navigationBarTitleText: '发起活动' }
