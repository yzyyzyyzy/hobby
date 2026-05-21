export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '资料详情' })
  : { navigationBarTitleText: '资料详情' }
