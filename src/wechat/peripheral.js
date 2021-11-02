

var server
var uuid1 = "FFFFFFFF-EEEE-EEEE-EEEE-000000647825"
var uuid2 = "FFFFFFFF-EEEE-EEEE-EEEE-111111647825"
var macAddr = "0X35:3742:0X2722342"

const buff = initBuf([9,11])
const desc = initBuf([1,10])

const service = {
  uuid: uuid1,
  characteristics: [{
    uuid: uuid2,
    properties: {
      read: true,
      write: false,
      notify: true,
      indicate: false
    },
    permission: {
      readable: true,
      writeable: false,
      readEncryptionRequired: false,
      writeEncryptionRequired: false
    },
    value: buff,
    descriptors: [{
      uuid: uuid2,
      permission: {
        write: false,
        read: true
      },
      value: desc
    }]
  }]
}

// 初始化 buffer
function initBuf(arr) {
  const buffer = new ArrayBuffer(arr.length)
  const dataView = new DataView(buffer)
  arr.map((o,i)=>{
    dataView.setUint8(i, o)
  })
  return buffer
}

// string转为ArrayBuffer
function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); 
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
  bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// buffer 转换成 16进制
function ab2hex(buffer) {
  let hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

// buffer 转换成 utf8
function ab2ToUtf8(h) {
  return Buffer.from(ab2hex(h),'hex').toString("utf-8")
}



// 打开蓝牙设备
openBluetoothAdapter() {
  wx.openBluetoothAdapter({
    mode: 'peripheral',
    success: (res) => {
      console.log('open BA succ...')
      this.createBLEPeripheralServer()
      wx.onBluetoothAdapterStateChange(function(res) {
        console.log('BA State Change...', res.available)
      })
    },
    fail: (res) => {
      console.log(res)
      if (res.errCode !== 10001) return
      wx.onBluetoothAdapterStateChange((res) => {
        if (!res.available) return
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
        })
      })
    }
  })
}


// 创建 BLE 服务器
createBLEPeripheralServer() {
  wx.createBLEPeripheralServer({
    success (res) {
      console.log("create BLE succ...")

      server = res.server
      server.addService({ service }).then(res => {
        console.log('add Service succ...', res)

        // 开始广播
        server.startAdvertising({
          advertiseRequest: {
            deviceName: "liyang IOS",
            serviceUuids: [uuid1],
          },
          success (res) {
            console.log("start advertis succ...")
            console.log(res)
          },
          fail: (res) => {
            console.log("start advertis fail...")
            console.log(res)
          },
        })
        
      })
      // 监听读特征请求
      server.onCharacteristicReadRequest(res => {
        const { serviceId, characteristicId, callbackId } = res
        const earAddr = str2ab(macAddr)
        console.log('onCharacteristicReadRequest', res, earAddr)
        server.writeCharacteristicValue({
          serviceId,
          characteristicId,
          value: earAddr,
          needNotify: true,
          callbackId
        })
      })
    },
    fail: (res) => {
      console.log("create BLE fail...")
    }
  })
}


componentDidMount () { 
  this.openBluetoothAdapter()
}

componentWillUnmount () { 
  server.stopAdvertising()
  server.close()
  wx.closeBluetoothAdapter()
}
