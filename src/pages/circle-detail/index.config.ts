export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '圈子详情' })
  : { navigationBarTitleText: '圈子详情' }
