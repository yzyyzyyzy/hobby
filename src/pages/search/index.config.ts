export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '搜索' })
  : { navigationBarTitleText: '搜索' }
