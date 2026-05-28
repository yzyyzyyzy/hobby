export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '提交补充' })
  : { navigationBarTitleText: '提交补充' }
