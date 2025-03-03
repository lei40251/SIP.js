# SIP.js 消息处理流程图

## 消息处理总体流程

```mermaid
graph TB
    Start[接收消息] --> Parse[解析JSON消息]
    Parse --> Switch{消息类型判断}

    %% 会话创建消息处理
    Switch -->|会话创建相关| CreateSession[会话创建处理]
    CreateSession --> FindCall[查找呼叫信息]
    FindCall --> |存在| UpdateSession[更新会话信息]
    UpdateSession --> AutoAnswer{自动应答?}
    AutoAnswer -->|是| Answer[执行应答]
    AutoAnswer -->|否| Store[存储会话]
    Answer --> Store
    Store --> End[结束处理]

    %% 会话状态变更处理
    Switch -->|状态变更| StateChange[状态变更处理]
    StateChange --> FindSession[查找会话信息]
    FindSession -->|不存在| CreateNew[创建新会话]
    FindSession -->|存在| UpdateState[更新状态]
    CreateNew --> UpdateState
    UpdateState --> CheckRelease{是否释放?}
    CheckRelease -->|是| DeleteSession[删除会话]
    CheckRelease -->|否| NotifyChange[通知状态变更]

    %% 系统登录信息处理
    Switch -->|系统登录| LoginInfo[登录信息处理]
    LoginInfo --> CheckServer[检查服务器配置]
    CheckServer --> UpdateConfig[更新配置信息]

    %% WebSocket登录处理
    Switch -->|WebSocket登录| WSLogin[WebSocket登录处理]
    WSLogin --> CheckResult{检查结果}
    CheckResult -->|成功| SetSuccess[设置登录成功]
    CheckResult -->|需要验证| ReLogin[重新登录]

    %% 其他消息处理
    Switch -->|其他| Other[其他消息]
    Other --> Callback[触发回调处理]

```

## 核心功能模块

```mermaid
graph LR
    Client[客户端模块] --> Parser[消息解析器]
    Parser --> Handler[消息处理器]

    Handler --> SessionMgr[会话管理]
    Handler --> StateMgr[状态管理]
    Handler --> LoginMgr[登录管理]
    Handler --> WSMgr[WebSocket管理]

    SessionMgr --> CallMgr[呼叫管理]
    SessionMgr --> VideoMgr[视频管理]
    SessionMgr --> FileMgr[文件管理]

    StateMgr --> EventMgr[事件管理]
    StateMgr --> CallbackMgr[回调管理]
```

## 消息类型和处理流程

1. 会话创建消息
   - 普通呼叫创建 (API_SESSION_CREATECALLCB)
   - 视频通话创建 (API_SESSION_CREATEVIDEOBUGCB)
   - 文件播放创建 (API_SESSION_CREATEPLAYFILECALLCB)
   - 发言申请创建 (API_SESSION_APPLYSPEAKCB)
   - 视频转接创建 (API_OPERATE_TRANSFER_VIDEOCB)

2. 会话状态消息
   - 状态变更通知 (EventSessionStateChange)
   - 会话创建、更新、释放处理
   - 状态回调通知

3. 系统登录消息
   - 服务器配置更新
   - 扩展服务器配置处理
   - 默认配置回退处理

4. WebSocket登录消息
   - 登录结果处理
   - 密码验证处理
   - 登录状态更新

## 关键数据结构

1. 会话信息 (MakeCallInfo)

   ```typescript
   interface MakeCallInfo {
       callid?: string;     // 呼叫ID
       cid: string;         // 会话ID
       autoanswer: boolean; // 自动应答标志
       ctype?: CallType;    // 呼叫类型
       state?: CallState;   // 呼叫状态
       // ... 其他字段
   }
   ```

2. 会话管理映射表

   ```typescript
   // 待处理呼叫映射表
   Map<string, MakeCallInfo> arrMakeCalls

   // 活动会话映射表
   Map<string, MakeCallInfo> arrSessions
   ```
