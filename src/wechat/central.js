// 创建 BLE 连接
createBleConn(deviceId) {
  wx.createBLEConnection({
    deviceId, 
    success: (r) => {
      this.getBleService(deviceId)
    },
    fail: (res) => {
      console.log(res)
    }
  })
}

// 获取 BLE 服务列表
getBleService(deviceId) {
  wx.getBLEDeviceServices({
    deviceId,
    success: (res) => {
      for (let i = 0; i < res.services.length; i++) {
        let o = res.services[i]
        // 根据 UUID 头过滤服务
        if ((o.isPrimary)&&(o.uuid.substr(4,4) === '181C')) {
            this.getBLEChar(deviceId,res.services[i].uuid)
        }
      }
    }
  })
}

// 读取特征值
getBLEChar(deviceId,serviceId) {
  wx.getBLEDeviceCharacteristics({
    deviceId, 
    serviceId, 
    success: (res) => {
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        if (item.properties.read) { 
          wx.readBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId: item.uuid,
            success (res) {
              console.log(res)
            }
          })
        }
      }
    }
  })
}

componentDidMount () {
  // 发现蓝牙设备
  wx.onBluetoothDeviceFound((res) => {
    res.devices.forEach((device) => {
      let deviceId = device.deviceId
      if (device.localName==="iPhone Test Blue") {
        console.log('Device Found', device)
        this.createBleConn(deviceId)
      }
    })
    wx.stopBluetoothDevicesDiscovery()
  })

  // 打开蓝牙设备
  wx.openBluetoothAdapter({
    mode: 'central',
    success: (res) => {
      // 查找蓝牙设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
      })
    },
    fail: (res) => {
      if (res.errCode !== 10001) return
      wx.onBluetoothAdapterStateChange((res) => {
        if (!res.available) return
        // 查找蓝牙设备
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
        })
      })
    }
  })

  // 回调获取特征值
  wx.onBLECharacteristicValueChange(function(res) {
    let addr = hexToStr(res.value)
    console.log(addr)
  })

}


componentWillUnmount () { 
  wx.closeBLEConnection({
    deviceId:deviceId,
    success(r) {
      console.log("Close Ble connection")
    }
  })
}