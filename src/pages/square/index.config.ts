export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '圈子广场' })
  : { navigationBarTitleText: '圈子广场' }
