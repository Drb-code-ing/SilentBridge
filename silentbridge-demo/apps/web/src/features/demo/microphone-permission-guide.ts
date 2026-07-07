import type { AudioCaptureFailureReason } from "./audio-capture-client";

export interface PermissionGuide {
  title: string;
  steps: string[];
  fallbackHint: string;
}

export function getPermissionGuide(reason: AudioCaptureFailureReason): PermissionGuide {
  switch (reason) {
    case "permission-denied":
      return {
        title: "麦克风权限被拒绝",
        steps: [
          "点击浏览器地址栏左侧的锁图标（或「i」图标）",
          "在弹出菜单中找到「麦克风」选项，改为「允许」",
          "刷新本页面后重新点击「开始收听」"
        ],
        fallbackHint: "如果不想授权麦克风，可以在下方备用输入框直接打字。"
      };
    case "no-device":
      return {
        title: "未检测到麦克风设备",
        steps: [
          "检查耳机或麦克风是否已正确插入电脑/手机",
          "如果用的是蓝牙耳机，确认已连接且电量充足",
          "插入设备后刷新页面再试"
        ],
        fallbackHint: "没有麦克风也可以在下方备用输入框直接打字。"
      };
    case "hardware-error":
      return {
        title: "麦克风被其他程序占用，无法使用",
        steps: [
          "关闭可能正在使用麦克风的程序（如会议软件、录音软件）",
          "重启浏览器后重新打开本页面",
          "如果仍然不行，尝试重启电脑"
        ],
        fallbackHint: "暂时无法录音时，可以在下方备用输入框直接打字。"
      };
    case "insecure-context":
      return {
        title: "当前环境不安全，浏览器禁止使用麦克风",
        steps: [
          "麦克风功能需要 HTTPS 安全连接或 localhost 环境",
          "如果你是从 http:// 访问的，请改用 https://",
          "本地开发时请用 http://localhost:5174 访问"
        ],
        fallbackHint: "环境限制不影响打字输入，可在下方备用输入框直接输入。"
      };
    case "no-browser-api":
      return {
        title: "当前浏览器不支持语音识别",
        steps: [
          "请使用 Chrome、Edge 等支持 Web Speech API 或 MediaRecorder 的浏览器",
          "更新浏览器到最新版本后重试",
          "如果用的是微信内置浏览器，请点击右上角用外部浏览器打开"
        ],
        fallbackHint: "浏览器不支持语音时，可在下方备用输入框直接打字。"
      };
    case "no-window":
      return {
        title: "运行环境异常，非浏览器环境",
        steps: [
          "请在浏览器中打开本页面",
          "如果是从 App 内访问，请用系统浏览器打开"
        ],
        fallbackHint: "环境异常不影响打字输入，可在下方备用输入框直接输入。"
      };
    default:
      return {
        title: "麦克风出现未知异常，无法使用",
        steps: [
          "刷新页面后重新点击「开始收听」",
          "如果反复出现，请检查浏览器麦克风设置",
          "换一个浏览器试试"
        ],
        fallbackHint: "无法录音时，可在下方备用输入框直接打字。"
      };
  }
}
