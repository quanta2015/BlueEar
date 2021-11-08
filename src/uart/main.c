#include <stream.h>
#include <sink.h>
#include <source.h>
#include <string.h>
#include <panic.h>
#include <message.h>
#include <app/uart/uart_if.h>
#include <stdio.h>


typedef struct {
  TaskData task;
  Sink uart_sink;
  Source uart_source;
} UARTStreamTaskData;
UARTStreamTaskData theUARTStreamTask;

static uint8 uart_recv_buf[UART_RECV_BUF_SIZE];
static void UARTStreamMessageHandler (Task pTask, MessageId pId, Message pMessage);
static void uart_data_stream_init(void);
void uart_send(uint8 *buf, uint16 len);


int main(void) {
  uart_data_stream_init();
  MessageLoop();
  return 0;
}

// 数据流初始化
void uart_data_stream_init(void) {
  theUARTStreamTask.task.handler = UARTStreamMessageHandler;
  StreamUartConfigure(VM_UART_RATE_38K4, VM_UART_STOP_ONE, VM_UART_PARITY_NONE);

  /* Get the sink for the uart */
  theUARTStreamTask.uart_sink = StreamUartSink();
  PanicNull(theUARTStreamTask.uart_sink);
  /* Get the source for the uart */
  theUARTStreamTask.uart_source = StreamUartSource();
  PanicNull(theUARTStreamTask.uart_source);

  MessageSinkTask(StreamSinkFromSource(theUARTStreamTask.uart_source), &theUARTStreamTask.task);
}

// 消息接收
static void uart_recv(void) {
  Source src;
  uint8 size;
  uint8 *buf;

  /*get the uart source header*/
  src = StreamUartSource();
  size = SourceSize(src);
  buf = (uint8 *)SourceMap(src);
  if (size > UART_RECV_BUF_SIZE) {
    SourceDrop(src, size);
    return;
  }
  
  uart_send(buf, size);
  memcpy(uart_recv_buf, buf, size);
  SourceDrop(src, size);
}

// 数据发送
void uart_send(uint8 *buf, uint16 len) {
  uint16 offset;
  uint8 *dest;

  /*get the sink for the uart, panic if not available*/
  Sink sink = StreamUartSink();
  PanicNull(sink);

  /*claim space in the sink, getting the offset to it*/
  offset = SinkClaim(sink, len);
  if (offset == 0xFFFF) Panic(); /*space not available*/

  /*Map the sink into memory space*/
  dest = SinkMap(sink);
  (void) PanicNull(dest);

  /*copy the string into the claimed space*/
  memcpy(dest + offset, buf, len);

  /*Flush the data out to the uart*/
  PanicZero(SinkFlush(sink, len));
}

// 消息处理
void UARTStreamMessageHandler (Task pTask, MessageId pId, Message pMessage) {
  switch (pId) {
  case MESSAGE_MORE_DATA:
    uart_recv();
    break;
  default:
    break;
  }
}
