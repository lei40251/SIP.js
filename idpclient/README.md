# idpclient SIP.js 客户端模块

这个模块将Client.ts打包成了可以在Vue3项目中通过import导入的JS文件。

## 使用方法

### 1. 安装

将打包后的`dist`目录复制到你的Vue3项目中，或者直接引用该路径。

### 2. 在Vue3项目中导入

```javascript
// 在Vue组件中导入
import { InitClient, Connect, Disconnect, MakeCall, Hangup } from './path/to/dist/Client.js';

export default {
  setup() {
    // 初始化客户端
    const initClient = () => {
      // 创建回调对象
      const callback = {
        onCallCreated: (id, info) => {
          console.log('Call created:', id, info);
        },
        onCallReceived: (id, info) => {
          console.log('Call received:', id, info);
        },
        // 其他回调方法...
      };
      
      // 初始化客户端
      InitClient(callback);
      
      // 连接到SIP服务器
      Connect('sip:user@example.com', 'password', 'wss://sipserver.example.com:8089/ws');
    };
    
    return {
      initClient
    };
  }
};
```

### 3. 注意事项

- 确保你的Vue3项目支持ES模块导入
- 如果遇到路径问题，可能需要调整导入路径或使用别名配置
- 该模块依赖于SIP.js库，确保相关依赖已正确安装

## 构建

如果需要重新构建该模块，请执行以下命令：

```bash
# 安装依赖
npm install --save-dev webpack webpack-cli ts-loader terser-webpack-plugin circular-dependency-plugin

# 执行构建
npx webpack --config webpack.config.cjs
```

构建后的文件将输出到`dist`目录。