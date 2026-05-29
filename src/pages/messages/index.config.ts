export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '动态广场' })
  : { navigationBarTitleText: '动态广场' }
