import { types } from 'mediasoup';

export const config = {
  worker: {
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
  } as types.WorkerSettings,
  
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      }
    ] as types.RtpCodecCapability[]
  } as types.RouterOptions,

  webRtcTransport: {
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: '10.236.160.159' // Replace with your public IP for production
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000
  } as types.WebRtcTransportOptions
};
