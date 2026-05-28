export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '补充资料' })
  : { navigationBarTitleText: '补充资料' }
