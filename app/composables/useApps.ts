import type { AppTool } from '@/types'

// Module-level singletons — shared across all useApps() calls
const appsView = ref<'list' | 'web'>('list')
const activeApp = ref<AppTool | null>(null)

export function useApps() {

  const appTools: AppTool[] = [
    { key: 'xuexi', name: '学习强国', description: '学习强国官网', icon: 'book', url: 'https://xuexi.cn' },
    { key: 'classwork', name: 'ClassWork 作业板', description: '显示作业内容和管理班级信息', icon: 'dashboard', url: 'https://classworks.wuyuan.dev/' },
    { key: 'cutdown', name: '倒计时', description: '在线倒计时', icon: 'alarm', url: 'https://www.lddgo.net/common/countdown' },
    { key: 'ua', name: 'User-Agent在线分析', description: '查看班牌的浏览器内核和系统信息', icon: 'app_shortcut', url: 'https://www.lddgo.net/network/useragent' },
    { key: 'gushiwen', name: '古文岛', description: '查询古诗文', icon: 'book', url: 'https://www.gushiwen.cn/default_1.aspx' }
  ]

  function openAppTool(tool: AppTool): void {
    activeApp.value = tool
    appsView.value = 'web'
  }

  function closeAppTool(): void {
    activeApp.value = null
    appsView.value = 'list'
  }

  return { appsView, activeApp, appTools, openAppTool, closeAppTool }
}
