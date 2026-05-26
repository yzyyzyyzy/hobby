/**
 * 客服按钮组件
 * 微信小程序的 openType="contact" 只支持原生 Button，
 * 因此封装为独立组件以绕过 ESLint 对原生 Button 的限制
 */
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface ContactButtonProps {
  /** 显示文字 */
  label?: string
  /** 来源标识 */
  sessionFrom?: string
  /** 自定义样式 */
  className?: string
  /** 图标组件 */
  icon?: React.ReactNode
  /** 是否显示箭头 */
  showArrow?: boolean
}

const isMiniApp = [Taro.ENV_TYPE.WEAPP as string, Taro.ENV_TYPE.TT as string].includes(Taro.getEnv() as string)

export function ContactButton({ label = '联系客服', sessionFrom = 'default', className = '', icon, showArrow = false }: ContactButtonProps) {
  if (isMiniApp) {
    return (
      <Button
        openType="contact"
        className={`contact-btn ${className}`}
        style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, lineHeight: 'inherit', fontSize: 'inherit', color: 'inherit', minWidth: 'auto' }}
        sessionFrom={sessionFrom}
        sendMessageTitle="Hobby客服咨询"
        sendMessagePath="/pages/index/index"
      >
        <View className="flex flex-row items-center gap-2">
          {icon}
          <Text>{label}</Text>
          {showArrow && <Text className="text-neutral-400">›</Text>}
        </View>
      </Button>
    )
  }

  return (
    <View
      className={`flex flex-row items-center gap-2 ${className}`}
      onClick={() => Taro.showToast({ title: '请在小程序中联系客服', icon: 'none' })}
    >
      {icon}
      <Text>{label}</Text>
    </View>
  )
}
