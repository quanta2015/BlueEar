# BlurMtoP

### 项目需求
通过手机微信小程序扫码，实现蓝牙耳机 [`sink`模式] 作为话筒，将音频信号传送到蓝牙板卡 [`source` 模式], 再通过音箱播放。


### 逻辑流程
1. 微信小程序扫码，获取耳机的mac地址 `NAP:UAP:LAP`;
2. 微信小程序启动蓝牙BLE `peripheral` 模式，创建服务将耳机 mac 地址作为特征值广播;
3. 蓝牙板卡启动蓝牙BLE `central` 模式[GATT]，连接微信小程序，读取耳机 mac 地址;
4. 蓝牙板卡通过普通蓝牙 `source` 模式，连接耳机;
5. 耳机通过麦克风将模拟音频转换成数字音频，发送给蓝牙板卡，蓝牙板卡将数字音频转换成模拟信号输出到音箱;


### 技术要点
1. 微信小程序 `peripheral` 模式的特征值发送
2. CSR8670芯片的 `source` 模型添加 `GATT` 服务
3. CSR8670芯片的 `source` 模型的数模信号转换


### 工作日志


#### 2021-10-31
- 编译 source 代码，烧录到开发板，通过 debug 信息了解 source 流程的状态机模型
- 验证数模转换和 headset 接口
- 解决 `如何通过耳机mac创建连接` 问题

```c
// 决定是否接收远程连接
bool connection_mgr_can_pair(const bdaddr *bd_addr) {
    switch (states_get_state()) {        
      case SOURCE_STATE_INQUIRING:
      case SOURCE_STATE_CONNECTING: {
        if (!BdaddrIsZero(&theSource->connection_data.remote_connection_addr))
        {
          /* 检查该地址是否已经匹配过 */
          if (BdaddrIsSame(&theSource->connection_data.remote_connection_addr, bd_addr))
              return TRUE;
          else
              return FALSE;
        }
    }
  ...
}


// 检查2个地址是否相同
bool BdaddrIsSame(const bdaddr *first, const bdaddr *second){ 
  return  first->nap == second->nap && 
          first->uap == second->uap && 
          first->lap == second->lap; 
}
```
