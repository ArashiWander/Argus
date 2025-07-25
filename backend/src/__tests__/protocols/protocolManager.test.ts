import { ProtocolManager } from '../../protocols/protocolManager';

describe('Protocol Manager', () => {
  let protocolManager: ProtocolManager;

  beforeEach(() => {
    // Reset environment variables to default state
    delete process.env.GRPC_ENABLED;
    delete process.env.MQTT_ENABLED;
    delete process.env.KAFKA_ENABLED;
    
    // Create a fresh instance for each test
    protocolManager = new ProtocolManager();
  });

  describe('Protocol Configuration', () => {
    it('should have HTTP enabled by default', () => {
      const config = protocolManager.getConfig();
      expect(config.http.enabled).toBe(true);
      expect(config.http.port).toBe(3001);
    });

    it('should have other protocols disabled by default', () => {
      const config = protocolManager.getConfig();
      expect(config.grpc.enabled).toBe(false);
      expect(config.mqtt.enabled).toBe(false);
      expect(config.kafka.enabled).toBe(false);
    });

    it('should enable gRPC when GRPC_ENABLED=true', () => {
      process.env.GRPC_ENABLED = 'true';
      const testManager = new ProtocolManager();
      const config = testManager.getConfig();
      expect(config.grpc.enabled).toBe(true);
    });

    it('should enable MQTT when MQTT_ENABLED=true', () => {
      process.env.MQTT_ENABLED = 'true';
      const testManager = new ProtocolManager();
      const config = testManager.getConfig();
      expect(config.mqtt.enabled).toBe(true);
    });

    it('should enable Kafka when KAFKA_ENABLED=true', () => {
      process.env.KAFKA_ENABLED = 'true';
      const testManager = new ProtocolManager();
      const config = testManager.getConfig();
      expect(config.kafka.enabled).toBe(true);
    });
  });

  describe('Protocol Status', () => {
    it('should return protocol status information', () => {
      const status = protocolManager.getProtocolStatus();
      
      expect(status).toHaveProperty('http');
      expect(status).toHaveProperty('grpc');
      expect(status).toHaveProperty('mqtt');
      expect(status).toHaveProperty('kafka');
      
      expect(status.http.enabled).toBe(false); // No protocols are started in tests
      expect(status.grpc.enabled).toBe(false);
      expect(status.mqtt.enabled).toBe(false);
      expect(status.kafka.enabled).toBe(false);
    });

    it('should return enabled protocols list', () => {
      const enabledProtocols = protocolManager.getEnabledProtocols();
      expect(Array.isArray(enabledProtocols)).toBe(true);
      // Initially empty because startProtocols() hasn't been called
      expect(enabledProtocols.length).toBe(0);
    });

    it('should check if specific protocol is enabled', () => {
      expect(protocolManager.isProtocolEnabled('http')).toBe(false);
      expect(protocolManager.isProtocolEnabled('grpc')).toBe(false);
      expect(protocolManager.isProtocolEnabled('mqtt')).toBe(false);
      expect(protocolManager.isProtocolEnabled('kafka')).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return health check information', async () => {
      const health = await protocolManager.healthCheck();
      
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('protocols');
      expect(typeof health.protocols).toBe('object');
    });
  });

  describe('Performance Metrics', () => {
    it('should return performance metrics', () => {
      const metrics = protocolManager.getPerformanceMetrics();
      expect(typeof metrics).toBe('object');
    });
  });
});