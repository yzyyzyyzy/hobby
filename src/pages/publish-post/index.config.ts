export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发布动态' })
  : { navigationBarTitleText: '发布动态' }
