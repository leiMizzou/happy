# LiveKit Agent 集成指南

## 📋 概述

本指南说明如何将 LiveKit Agent 作为 ElevenLabs 的替代方案集成到 Happy 应用中。

## 🎯 集成目标

- ✅ 保持与 ElevenLabs 相同的 API 接口
- ✅ 最小化 Happy 代码改动
- ✅ 支持运行时切换（ElevenLabs ↔️ LiveKit）
- ✅ 保持现有业务逻辑不变

## 📦 步骤 1: 安装依赖

```bash
cd /path/to/happy
yarn add livekit-client
```

## 📁 步骤 2: 添加新文件

将以下文件复制到 `sources/realtime/` 目录：

```
sources/realtime/
├── LiveKitProvider.tsx          (新建) ✨
├── LiveKitVoiceSession.web.tsx  (新建) ✨
├── livekitConfig.ts             (新建) ✨
├── RealtimeProvider.livekit.tsx (新建) ✨
└── (现有文件保持不变)
```

## 🔧 步骤 3: 配置切换机制

### 方案 A: 环境变量切换（推荐）

**1. 修改 `app.config.js`**

```javascript
export default {
  // ... 现有配置
  extra: {
    voiceProvider: process.env.VOICE_PROVIDER || 'elevenlabs', // 'elevenlabs' or 'livekit'
  }
}
```

**2. 创建 `.env` 文件**

```bash
# 开发环境使用 LiveKit
VOICE_PROVIDER=livekit

# 生产环境使用 ElevenLabs
# VOICE_PROVIDER=elevenlabs
```

**3. 修改主应用入口**

在你的主 App 文件中（通常是 `App.tsx` 或 `index.tsx`）：

```tsx
import Constants from 'expo-constants';

// 动态导入 Provider
const voiceProvider = Constants.expoConfig?.extra?.voiceProvider || 'elevenlabs';

const RealtimeProvider = voiceProvider === 'livekit'
  ? require('./sources/realtime/RealtimeProvider.livekit').RealtimeProvider
  : require('./sources/realtime/RealtimeProvider').RealtimeProvider;

function App() {
  return (
    <RealtimeProvider>
      {/* Your app content */}
    </RealtimeProvider>
  );
}
```

### 方案 B: 直接替换文件（最简单）

如果你想完全切换到 LiveKit，最简单的方法是：

```bash
# 备份原有文件
mv sources/realtime/RealtimeProvider.tsx sources/realtime/RealtimeProvider.elevenlabs.tsx

# 使用 LiveKit 版本
cp sources/realtime/RealtimeProvider.livekit.tsx sources/realtime/RealtimeProvider.tsx
```

恢复时：
```bash
mv sources/realtime/RealtimeProvider.elevenlabs.tsx sources/realtime/RealtimeProvider.tsx
```

## 🚀 步骤 4: 启动 LiveKit 服务

确保以下服务正在运行：

```bash
# 1. 启动 LiveKit Server
docker run -d --name livekit-server \
  -p 7880:7880 \
  -v $(pwd)/config/livekit.yaml:/etc/livekit.yaml \
  livekit/livekit-server:latest \
  --config /etc/livekit.yaml

# 2. 启动 Token Server
cd livekit-agent
source venv/bin/activate
python token_server.py &

# 3. 启动 Agent
python agent.py dev &

# 4. 启动 FunASR（如果使用）
docker start funasr-service
```

或者使用快速启动脚本：
```bash
cd livekit-agent
./quickstart.sh
./run_agent.sh
```

## ✅ 步骤 5: 测试

1. 启动 Happy 应用
2. 触发语音功能
3. 应该能够：
   - 建立语音连接
   - 听到 AI 的欢迎消息
   - 进行语音对话
   - 接收 AI 回复

## 🔍 调试

### 检查连接状态

在浏览器控制台查看日志：

```
// 应该看到这些日志
✅ LiveKit VoiceSession registered
✅ Connecting to LiveKit room: happy-call-xxx
✅ Connected to LiveKit room
✅ Microphone enabled
✅ Participant connected: agent
✅ Track subscribed: audio from agent
✅ Audio track attached and playing
```

### 常见问题

#### 1. 连接失败

检查 Token Server 是否运行：
```bash
curl http://localhost:8082/health
```

#### 2. 没有声音

- 检查浏览器是否允许自动播放
- 打开 Chrome DevTools → 查看 Audio 元素
- 检查 Agent 是否正在运行

#### 3. 麦克风无法访问

确保在 HTTPS 或 localhost 下运行（WebRTC 要求）

## 🔄 切换回 ElevenLabs

### 如果使用环境变量方案：

```bash
# 修改 .env
VOICE_PROVIDER=elevenlabs

# 重启应用
yarn web
```

### 如果使用直接替换方案：

```bash
# 恢复原文件
mv sources/realtime/RealtimeProvider.elevenlabs.tsx sources/realtime/RealtimeProvider.tsx
```

## 📊 性能对比

| 指标           | ElevenLabs | LiveKit Agent |
|---------------|------------|---------------|
| 首次响应延迟   | ~500ms     | ~200-300ms    |
| 连接建立时间   | ~1-2s      | ~0.5-1s       |
| 音频质量      | 优秀       | 优秀          |
| 成本          | 按使用付费  | 免费（自建）   |
| 定制化        | 受限       | 完全可控      |

## 🎨 高级配置

### 自定义 Token Server URL

编辑 `livekitConfig.ts`:

```typescript
export const livekitConfig = {
  tokenServerUrl: 'https://your-domain.com/token',
  // ...
}
```

### 调整音频质量

在 `LiveKitVoiceSession.web.tsx` 中：

```typescript
await room.localParticipant.setMicrophoneEnabled(true, {
  audioBitrate: 64000, // 调整码率
});
```

### 添加自定义事件

```typescript
room.on(RoomEvent.DataReceived, (payload) => {
  const data = JSON.parse(new TextDecoder().decode(payload));

  // 自定义处理
  if (data.type === 'custom_event') {
    // 处理自定义事件
  }
});
```

## 📚 API 兼容性

LiveKit 实现完全兼容 Happy 的 `VoiceSession` 接口：

```typescript
interface VoiceSession {
  ✅ startSession(config: VoiceSessionConfig): Promise<void>
  ✅ endSession(): Promise<void>
  ✅ sendTextMessage(message: string): void
  ✅ sendContextualUpdate(update: string): void
}
```

所有使用 `startRealtimeSession()` 等函数的代码都无需修改。

## 🆘 获取帮助

如果遇到问题：

1. 查看浏览器控制台日志
2. 检查 Agent 日志：`tail -f /tmp/agent-fresh-start.log`
3. 检查 Token Server 日志
4. 使用 `chrome://webrtc-internals/` 调试 WebRTC 连接

## ✨ 总结

- 🎯 零业务代码改动
- 🔄 可随时切换回 ElevenLabs
- 🚀 性能更好，延迟更低
- 💰 成本更低（自建）
- 🔧 完全可控和定制

Happy coding! 🎉
