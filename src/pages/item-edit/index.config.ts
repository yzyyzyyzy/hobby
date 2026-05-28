export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '编辑条目' })
  : { navigationBarTitleText: '编辑条目' }
