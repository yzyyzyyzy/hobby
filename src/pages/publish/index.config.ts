export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发布' })
  : { navigationBarTitleText: '发布' }
